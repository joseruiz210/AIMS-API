const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/appError');

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });
  return list;
};

const authenticate = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token;
  }

  if (!token) {
    return next(AppError.unauthorized('Token de acceso requerido'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Token de acceso requerido'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden('No tienes permisos para realizar esta acción')
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
