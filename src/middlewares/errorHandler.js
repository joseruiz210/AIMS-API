const AppError = require('../utils/appError');

const errorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errors = err.errors || [];

  // Prisma known errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.[0] || 'campo';
    message = `Ya existe un registro con ese valor de ${field}`;
    errors = [`El campo ${field} debe ser único`];
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Registro no encontrado';
  }

  // Database connectivity & DNS issues
  if (
    (err.message && (err.message.includes('EAI_AGAIN') || err.message.includes('Can\'t reach database server') || err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED'))) ||
    err.code === 'P1001'
  ) {
    statusCode = 503;
    message = 'La base de datos está restableciendo conexión. Por favor reintenta en un momento.';
  } else if (err.name?.includes('Prisma') || (typeof err.message === 'string' && err.message.includes('prisma.'))) {
    if (!err.isJoi && !err.statusCode) {
      statusCode = 500;
      message = 'Ocurrió un error al procesar la operación en la base de datos.';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Joi validation errors
  if (err.isJoi) {
    statusCode = 400;
    message = 'Error de validación';
    errors = err.details.map((detail) => detail.message);
  }

  // Log error in development (all errors) or production (server errors only)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else if (statusCode >= 500) {
    // In production, always log server errors for observability
    console.error(`[${new Date().toISOString()}] SERVER_ERROR ${statusCode}:`, err.message);
  }

  // Safety net: never expose raw error messages for 500s in production
  const safeMessage = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor. Intenta de nuevo más tarde.'
    : message;

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
