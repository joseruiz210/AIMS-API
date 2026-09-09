const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const userRepository = require('../users/user.repository');
const authRepository = require('./auth.repository');
const AppError = require('../../utils/appError');
const { generateRandomToken, hashToken } = require('../../utils/token');
const { sendVerificationEmail, sendPasswordResetEmail, sendMagicLinkEmail } = require('../../utils/mailer');
const { resolveRoleFromEmail } = require('../../utils/roleResolver');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

class AuthService {
  async register(userData) {
    const resolvedRole = resolveRoleFromEmail(userData.email);

    const emailExists = await userRepository.existsByEmail(userData.email);
    if (emailExists) {
      throw AppError.conflict('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const { unhashedToken, hashedToken } = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await userRepository.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone || null,
      password: hashedPassword,
      role: resolvedRole,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires,
    });

    sendVerificationEmail(user.email, unhashedToken).catch((err) => {
      console.error('Error al enviar correo de verificación:', err.message);
    });

    return {
      user,
      message: 'Usuario registrado exitosamente. Se ha enviado un correo para verificar tu cuenta.',
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw AppError.forbidden('La cuenta está desactivada. Contacta al administrador.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    if (!user.isEmailVerified) {
      throw AppError.forbidden('Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
    }

    const accessToken = this._generateAccessToken(user);
    const refreshToken = await this._generateAndSaveRefreshToken(user.id);

    const { password: _, emailVerificationToken, emailVerificationExpires, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(unhashedToken) {
    const hashed = hashToken(unhashedToken);
    const user = await authRepository.findUserByVerificationToken(hashed);

    if (!user) {
      throw AppError.badRequest('El token de verificación es inválido o ya ha sido utilizado.');
    }

    await authRepository.verifyUserEmail(user.id);

    return { message: 'Correo electrónico verificado exitosamente.' };
  }

  async resendVerificationEmail(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: 'Si el correo está registrado y no verificado, recibirás las instrucciones en tu bandeja de entrada.' };
    }

    if (user.isEmailVerified) {
      throw AppError.badRequest('Este correo electrónico ya se encuentra verificado.');
    }

    const { unhashedToken, hashedToken } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await authRepository.updateVerificationToken(user.id, hashedToken, expiresAt);

    await sendVerificationEmail(user.email, unhashedToken);

    return { message: 'Si el correo está registrado y no verificado, recibirás las instrucciones en tu bandeja de entrada.' };
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: 'Si el correo existe en nuestra plataforma, se enviará un enlace de recuperación.' };
    }

    const { unhashedToken, hashedToken } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await authRepository.saveResetPasswordToken(user.id, hashedToken, expiresAt);
    await sendPasswordResetEmail(user.email, unhashedToken);

    return { message: 'Si el correo existe en nuestra plataforma, se enviará un enlace de recuperación.' };
  }

  async validateResetToken(unhashedToken) {
    const hashed = hashToken(unhashedToken);
    const user = await authRepository.findUserByResetToken(hashed);

    if (!user) {
      throw AppError.badRequest('El token de recuperación es inválido o ha expirado.');
    }

    return { message: 'El token de recuperación de contraseña es válido.' };
  }

  async resetPassword(unhashedToken, newPassword) {
    const hashed = hashToken(unhashedToken);
    const user = await authRepository.findUserByResetToken(hashed);

    if (!user) {
      throw AppError.badRequest('El token de recuperación es inválido o ha expirado.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await authRepository.resetPassword(user.id, hashedPassword);
    await authRepository.revokeAllUserRefreshTokens(user.id);

    return { message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.' };
  }

  async refreshToken(refreshTokenStr) {
    const storedToken = await authRepository.findRefreshToken(refreshTokenStr);

    if (!storedToken || storedToken.revokedAt || new Date(storedToken.expiresAt) < new Date()) {
      throw AppError.unauthorized('Refresh token inválido, expirado o revocado.');
    }

    if (!storedToken.user.isActive) {
      throw AppError.forbidden('La cuenta está desactivada.');
    }

    const accessToken = this._generateAccessToken(storedToken.user);
    const newRefreshToken = await this._generateAndSaveRefreshToken(storedToken.user.id);
    await authRepository.revokeRefreshToken(storedToken.id, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshTokenStr, userId = null) {
    if (refreshTokenStr) {
      const storedToken = await authRepository.findRefreshToken(refreshTokenStr);
      if (storedToken) {
        await authRepository.revokeRefreshToken(storedToken.id);
      }
    } else if (userId) {
      await authRepository.revokeAllUserRefreshTokens(userId);
    }

    return { message: 'Sesión cerrada exitosamente.' };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw AppError.badRequest('La contraseña actual es incorrecta');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.update(userId, { password: hashedNewPassword });
    await authRepository.revokeAllUserRefreshTokens(userId);

    return { message: 'Contraseña actualizada exitosamente.' };
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }
    return user;
  }

  async sendMagicLink(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: 'Si el correo está registrado, recibirás un enlace de acceso.' };
    }

    if (!user.isActive) {
      throw AppError.forbidden('La cuenta está desactivada. Contacta al administrador.');
    }

    const { unhashedToken, hashedToken } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await authRepository.saveMagicLinkToken(user.id, hashedToken, expiresAt);
    await sendMagicLinkEmail(user.email, unhashedToken);

    return { message: 'Si el correo está registrado, recibirás un enlace de acceso.' };
  }

  async verifyMagicLink(unhashedToken) {
    const hashed = hashToken(unhashedToken);
    const user = await authRepository.findUserByMagicLinkToken(hashed);

    if (!user) {
      throw AppError.badRequest('El enlace de acceso es inválido o ha expirado.');
    }

    if (!user.isActive) {
      throw AppError.forbidden('La cuenta está desactivada.');
    }

    await authRepository.clearMagicLinkToken(user.id);

    const accessToken = this._generateAccessToken(user);
    const refreshToken = await this._generateAndSaveRefreshToken(user.id);

    const { password, emailVerificationToken, emailVerificationExpires, resetPasswordToken, resetPasswordExpires, magicLinkToken, magicLinkExpires, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      message: 'Inicio de sesión exitoso.',
    };
  }

  async googleLogin(idToken) {
    if (!idToken) {
      throw AppError.badRequest('El token de Google es requerido');
    }

    let payload;
    try {
      payload = jwt.decode(idToken);
    } catch (err) {
      // Ignore jwt decode error, will fallback below
    }

    if (!payload || !payload.email) {
      try {
        const fetchRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (fetchRes.ok) {
          payload = await fetchRes.json();
        }
      } catch (err) {
        console.error('Error fetching Google userinfo:', err.message);
      }
    }

    if (!payload || !payload.email) {
      throw AppError.badRequest('El token de Google no es válido o expiró');
    }

    const email = payload.email.toLowerCase();
    let user = await userRepository.findByEmail(email);

    if (!user) {
      const role = resolveRoleFromEmail(email);
      const firstName = payload.given_name || payload.name || 'Usuario';
      const lastName = payload.family_name || 'Google';
      const randomPassword = await bcrypt.hash(generateRandomToken().unhashedToken, SALT_ROUNDS);

      user = await userRepository.create({
        firstName,
        lastName,
        email,
        password: randomPassword,
        role,
        googleId: payload.sub || null,
        isEmailVerified: true,
        isActive: true,
      });
    } else {
      if (!user.isActive) {
        throw AppError.forbidden('La cuenta está desactivada. Contacta al administrador.');
      }
      if (!user.isEmailVerified || !user.googleId) {
        await userRepository.update(user.id, {
          isEmailVerified: true,
          googleId: payload.sub || user.googleId,
        });
      }
    }

    const accessToken = this._generateAccessToken(user);
    const refreshToken = await this._generateAndSaveRefreshToken(user.id);

    const { password, emailVerificationToken, emailVerificationExpires, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  _generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
  }

  async _generateAndSaveRefreshToken(userId) {
    const { unhashedToken } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken({
      userId,
      token: unhashedToken,
      expiresAt,
    });

    return unhashedToken;
  }
}

module.exports = new AuthService();
