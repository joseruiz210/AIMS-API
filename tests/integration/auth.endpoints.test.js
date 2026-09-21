const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');

jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  compare: jest.fn().mockImplementation(async (plain, hashed) => {
    if (plain === 'Password123') return true;
    return false;
  }),
  hash: jest.fn().mockImplementation(async (plain) => `$2a$12$mockHashed_${plain}`),
}));

// Mock external dependencies to isolate test suite
jest.mock('../../src/middlewares/rateLimiter', () => ({
  authLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(),
}));
jest.mock('../../src/modules/usuarios/repositories/userRepository');
jest.mock('../../src/modules/auth/repositories/authRepository');
jest.mock('../../src/utils/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendMagicLinkEmail: jest.fn().mockResolvedValue(true),
}));

const userRepository = require('../../src/modules/usuarios/repositories/userRepository');
const authRepository = require('../../src/modules/auth/repositories/authRepository');

describe('Auth Module Complete Integration Tests', () => {
  const mockUser = {
    id: 'user-uuid-1234',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@soy.sena.edu.co',
    password: '$2a$12$eImiTXuWVxfM37uY4JANjO5E/80.J3iP1N8oF11Yy.P2m/N41a3pC', // 'Password123'
    role: 'APRENDIZ',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validAccessToken = jwt.sign(
    { id: mockUser.id, email: mockUser.email, role: mockUser.role },
    env.jwtSecret,
    { expiresIn: '15m' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 1. LOGIN ─────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      authRepository.createRefreshToken.mockResolvedValue({ token: 'mock-refresh-token' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'juan.perez@soy.sena.edu.co',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(mockUser.email);
    });

    test('should fail login with invalid password (401)', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'juan.perez@soy.sena.edu.co',
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('contraseña ingresada es incorrecta');
    });

    test('should fail login with non-existent email (401)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@soy.sena.edu.co',
          password: 'Password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No existe ninguna cuenta registrada con este correo electrónico');
    });

    test('should fail login when user email is not verified (403)', async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'juan.perez@soy.sena.edu.co',
          password: 'Password123',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Debes verificar tu correo electrónico');
    });
  });

  // ─── 2. ME (GET AUTHENTICATED USER) ──────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    test('should return authenticated user profile', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(mockUser.email);
    });

    test('should reject request without JWT token (401)', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 3. REFRESH TOKEN ────────────────────────────────────────────────────
  describe('POST /api/v1/auth/refresh-token', () => {
    test('should rotate refresh token successfully', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'token-id-123',
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        user: mockUser,
      });
      authRepository.createRefreshToken.mockResolvedValue({ token: 'new-refresh-token' });
      authRepository.revokeRefreshToken.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    test('should reject expired or revoked refresh token (401)', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'token-id-123',
        token: 'revoked-refresh-token',
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: new Date(),
        user: mockUser,
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'revoked-refresh-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 4. LOGOUT ───────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    test('should logout successfully by revoking refresh token', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'token-id-123',
        user: mockUser,
      });
      authRepository.revokeRefreshToken.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Sesión cerrada exitosamente.');
    });
  });

  // ─── 5. EMAIL VERIFICATION & RECOVERY ──────────────────────────────────
  describe('POST /api/v1/auth/forgot-password', () => {
    test('should return generic success message to prevent email enumeration', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Si el correo existe');
    });
  });

  describe('POST & GET /api/v1/auth/verify-email', () => {
    test('should verify email successfully with valid token via POST', async () => {
      authRepository.findUserByVerificationToken.mockResolvedValue(mockUser);
      authRepository.verifyUserEmail.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'valid-verification-token-string' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Correo electrónico verificado exitosamente');
      expect(authRepository.verifyUserEmail).toHaveBeenCalledWith(mockUser.id);
    });

    test('should verify email successfully with valid token via GET query param', async () => {
      authRepository.findUserByVerificationToken.mockResolvedValue(mockUser);
      authRepository.verifyUserEmail.mockResolvedValue(true);

      const res = await request(app)
        .get('/api/v1/auth/verify-email')
        .query({ token: 'valid-verification-token-string' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return HTML landing page when verify-email is requested by a browser (Accept: text/html)', async () => {
      authRepository.findUserByVerificationToken.mockResolvedValue(mockUser);
      authRepository.verifyUserEmail.mockResolvedValue(true);

      const res = await request(app)
        .get('/api/v1/auth/verify-email')
        .set('Accept', 'text/html')
        .query({ token: 'valid-verification-token-string' });

      expect(res.status).toBe(200);
      expect(res.text).toContain('AIMS');
      expect(res.text).toContain('Cuenta Verificada y Activada');
      expect(res.text).toContain('miproyecto://auth');
    });

    test('should reject invalid or expired verification token (400)', async () => {
      authRepository.findUserByVerificationToken.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token-here' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    test('should send verification email when user exists and is not verified', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUser, isEmailVerified: false });
      authRepository.updateVerificationToken.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'juan.perez@soy.sena.edu.co' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(authRepository.updateVerificationToken).toHaveBeenCalled();
    });

    test('should return 400 when user is already verified', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUser, isEmailVerified: true });

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'juan.perez@soy.sena.edu.co' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ya se encuentra verificado');
    });

    test('should return generic 200 message when user email does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'no-existe@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST & GET /api/v1/auth/validate-reset-token', () => {
    test('should validate valid reset token via POST', async () => {
      authRepository.findUserByResetToken.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/validate-reset-token')
        .send({ token: 'valid-reset-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should validate valid reset token via GET query param', async () => {
      authRepository.findUserByResetToken.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/v1/auth/validate-reset-token')
        .query({ token: 'valid-reset-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should reject invalid or expired reset token', async () => {
      authRepository.findUserByResetToken.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/validate-reset-token')
        .send({ token: 'invalid-reset-token' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    test('should reset password and revoke all active refresh tokens', async () => {
      authRepository.findUserByResetToken.mockResolvedValue(mockUser);
      authRepository.resetPassword.mockResolvedValue(true);
      authRepository.revokeAllUserRefreshTokens.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          newPassword: 'NewSecurePassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(authRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockUser.id);
    });

    test('should render HTML page on GET /api/v1/auth/reset-password when opened by browser', async () => {
      authRepository.findUserByResetToken.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/v1/auth/reset-password')
        .set('Accept', 'text/html')
        .query({ token: 'valid-reset-token' });

      expect(res.status).toBe(200);
      expect(res.text).toContain('AIMS');
      expect(res.text).toContain('Restablecer Contraseña');
      expect(res.text).toContain('miproyecto://reset-password');
    });
  });

  // ─── 6. CHANGE PASSWORD ──────────────────────────────────────────────────
  describe('POST /api/v1/auth/change-password', () => {
    test('should change password for authenticated user and revoke active sessions', async () => {
      userRepository.findByIdWithPassword.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(true);
      authRepository.revokeAllUserRefreshTokens.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'BrandNewPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(authRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockUser.id);
    });

    test('should fail when current password is wrong (400)', async () => {
      userRepository.findByIdWithPassword.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          currentPassword: 'ContraseñaIncorrecta1',
          newPassword: 'BrandNewPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('contraseña actual es incorrecta');
    });

    test('should fail when new password is weak / invalid format (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'solominusculas',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 11. MAGIC LINK & GOOGLE LOGIN ──────────────────────────────────────────
  describe('POST /api/v1/auth/magic-link', () => {
    test('should request magic link email successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      authRepository.saveMagicLinkToken.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/magic-link')
        .send({ email: 'juan.perez@soy.sena.edu.co' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('recibirás un enlace');
    });

    test('should verify magic link token successfully', async () => {
      authRepository.findUserByMagicLinkToken.mockResolvedValue(mockUser);
      authRepository.clearMagicLinkToken.mockResolvedValue(true);
      authRepository.createRefreshToken.mockResolvedValue({ token: 'mock-refresh' });

      const res = await request(app)
        .post('/api/v1/auth/magic-link/verify')
        .send({ token: 'valid-magic-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/google', () => {
    test('should login or register user via google OAuth token', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      authRepository.createRefreshToken.mockResolvedValue({ token: 'mock-refresh' });

      const mockGoogleJwt = jwt.sign(
        { email: 'juan.perez@soy.sena.edu.co', given_name: 'Juan', family_name: 'Pérez', sub: 'google-1234' },
        'secret'
      );

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ idToken: mockGoogleJwt });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });
});
