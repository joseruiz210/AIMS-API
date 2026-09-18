const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

/**
 * Strict rate limiter for sensitive authentication endpoints (login, password reset, resend verification).
 * Prevents brute-force credential stuffing and denial of service.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 50 : 500, // Permitir testing fluido
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (req, res, next) => {
    next(AppError.tooManyRequests('Demasiados intentos desde esta IP. Por favor intenta de nuevo en 15 minutos.'));
  },
});

/**
 * General rate limiter for standard endpoints.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (req, res, next) => {
    next(AppError.tooManyRequests('Límite de solicitudes alcanzado. Por favor intenta más tarde.'));
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
