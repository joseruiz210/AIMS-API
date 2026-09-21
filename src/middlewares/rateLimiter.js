const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

/**
 * Obtiene y limpia la dirección IP del cliente (removiendo puertos añadidos por proxies como Azure App Service).
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim())
    : (req.ip || req.socket?.remoteAddress || '127.0.0.1');

  if (typeof ip === 'string') {
    // Quitar prefijo IPv6 si existe (ej. ::ffff:127.0.0.1)
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    // Quitar puerto si es IPv4 con puerto (ej. 181.137.250.134:58593)
    if (ip.includes('.') && ip.includes(':')) {
      ip = ip.split(':')[0];
    }
    // Quitar corchetes y puerto si es IPv6 (ej. [2001:db8::1]:58593)
    ip = ip.replace(/^\[([^\]]+)\](?::\d+)?$/, '$1');
  }

  return ip || '127.0.0.1';
};

/**
 * Strict rate limiter for sensitive authentication endpoints (login, password reset, resend verification).
 * Prevents brute-force credential stuffing and denial of service.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 50 : 500, // Permitir testing fluido
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: { ip: false, xForwardedForHeader: false, default: false },
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
  keyGenerator: getClientIp,
  validate: { ip: false, xForwardedForHeader: false, default: false },
  handler: (req, res, next) => {
    next(AppError.tooManyRequests('Límite de solicitudes alcanzado. Por favor intenta más tarde.'));
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
