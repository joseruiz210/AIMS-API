const authService = require('../services/authService');
const { success, created } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');
const {
  renderVerificationSuccessHtml,
  renderVerificationErrorHtml,
  renderResetPasswordHtml,
  renderMagicLinkSuccessHtml,
  renderMagicLinkErrorHtml,
} = require('../../../utils/authHtmlTemplates');

class AuthController {
  register = catchAsync(async (req, res) => {
    const clientOrigin = req.get('x-client-origin') || req.get('origin') || req.get('referer');
    const result = await authService.register({ ...req.body, clientOrigin });
    return created(res, result.user, result.message);
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    if (result?.accessToken) {
      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return success(res, result, 'Inicio de sesión exitoso');
  });

  verifyEmail = catchAsync(async (req, res) => {
    const token = req.query.token || req.body.token;
    const isHtml = req.accepts(['json', 'html']) === 'html';

    try {
      const result = await authService.verifyEmail(token);
      if (isHtml) {
        return res.status(200).send(renderVerificationSuccessHtml(result.message));
      }
      return success(res, null, result.message);
    } catch (err) {
      if (isHtml) {
        return res.status(err.statusCode || 400).send(renderVerificationErrorHtml(err.message));
      }
      throw err;
    }
  });

  resendVerification = catchAsync(async (req, res) => {
    const { email } = req.body;
    const clientOrigin = req.get('x-client-origin') || req.get('origin') || req.get('referer');
    const result = await authService.resendVerificationEmail(email, clientOrigin);
    return success(res, null, result.message);
  });

  forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const clientOrigin = req.get('x-client-origin') || req.get('origin') || req.get('referer');
    const result = await authService.forgotPassword(email, clientOrigin);
    return success(res, null, result.message);
  });

  validateResetToken = catchAsync(async (req, res) => {
    const token = req.query.token || req.body.token;
    const result = await authService.validateResetToken(token);
    return success(res, null, result.message);
  });

  renderResetPasswordPage = catchAsync(async (req, res) => {
    const token = req.query.token || req.body?.token;
    const isHtml = req.accepts(['json', 'html']) === 'html';

    if (!token) {
      if (isHtml) {
        return res.status(400).send(renderResetPasswordHtml({ token: '', error: 'Token de recuperación no proporcionado.' }));
      }
      return res.status(400).json({ success: false, message: 'Token de recuperación no proporcionado.' });
    }

    try {
      await authService.validateResetToken(token);
      if (isHtml) {
        return res.status(200).send(renderResetPasswordHtml({ token }));
      }
      return success(res, null, 'Token de recuperación válido');
    } catch (err) {
      if (isHtml) {
        return res.status(err.statusCode || 400).send(renderResetPasswordHtml({ token, error: err.message }));
      }
      throw err;
    }
  });

  resetPassword = catchAsync(async (req, res) => {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return success(res, null, result.message);
  });

  refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    if (result?.accessToken) {
      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return success(res, result, 'Token renovado exitosamente');
  });

  logout = catchAsync(async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    const userId = req.user?.id;
    const result = await authService.logout(refreshToken, userId);
    res.clearCookie('token');
    return success(res, null, result.message);
  });

  changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    return success(res, null, result.message);
  });

  getMe = catchAsync(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    return success(res, user, 'Perfil obtenido exitosamente');
  });

  sendMagicLink = catchAsync(async (req, res) => {
    const { email } = req.body;
    const clientOrigin = req.get('x-client-origin') || req.get('origin') || req.get('referer');
    const result = await authService.sendMagicLink(email, clientOrigin);
    return success(res, null, result.message);
  });

  verifyMagicLink = catchAsync(async (req, res) => {
    const token = req.query.token || req.body.token;
    const isHtml = req.accepts(['json', 'html']) === 'html';

    try {
      const result = await authService.verifyMagicLink(token);
      if (result?.accessToken) {
        res.cookie('token', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }
      if (isHtml) {
        return res.status(200).send(renderMagicLinkSuccessHtml({ token, user: result.user, message: result.message }));
      }
      return success(res, result, 'Inicio de sesión exitoso');
    } catch (err) {
      if (isHtml) {
        return res.status(err.statusCode || 400).send(renderMagicLinkErrorHtml(err.message));
      }
      throw err;
    }
  });

  googleLogin = catchAsync(async (req, res) => {
    const { idToken } = req.body;
    const result = await authService.googleLogin(idToken);
    if (result?.accessToken) {
      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return success(res, result, 'Inicio de sesión con Google exitoso');
  });
}

module.exports = new AuthController();
