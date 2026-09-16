const { Router } = require('express');
const authController = require('../controllers/authController');
const validate = require('../../../middlewares/validate');
const { authenticate } = require('../../../middlewares/auth');
const { authLimiter } = require('../../../middlewares/rateLimiter');

const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
  googleLoginSchema,
} = require('../validators/authValidator');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación, gestión de sesión, verificación de correo y recuperación de contraseña
 */

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/magic-link', authLimiter, validate({ body: emailOnlySchema }), authController.sendMagicLink);
router.post('/magic-link/verify', authLimiter, authController.verifyMagicLink);
router.get('/magic-link/verify', authLimiter, authController.verifyMagicLink);
router.post('/google', authLimiter, validate({ body: googleLoginSchema }), authController.googleLogin);
router.post('/verify-email', authLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.get('/verify-email', authLimiter, authController.verifyEmail);
router.post('/resend-verification', authLimiter, validate({ body: emailOnlySchema }), authController.resendVerification);
router.post('/forgot-password', authLimiter, validate({ body: emailOnlySchema }), authController.forgotPassword);
router.post('/validate-reset-token', authLimiter, validate({ body: verifyEmailSchema }), authController.validateResetToken);
router.get('/validate-reset-token', authLimiter, authController.validateResetToken);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/refresh-token', validate({ body: refreshTokenSchema }), authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
