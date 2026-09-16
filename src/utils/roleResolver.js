const AppError = require('./appError');

/**
 * Resolves the user role based on the email domain according to project rules:
 * - @soy.sena.edu.co -> APRENDIZ
 * - @sena.edu.co -> INSTRUCTOR
 * - @gmail.com -> APRENDIZ
 * - Any other domain -> Reject registration
 * 
 * @param {string} email 
 * @returns {string} resolved role
 */
const resolveRoleFromEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw AppError.badRequest('El correo electrónico es obligatorio');
  }

  const parts = email.trim().split('@');
  if (parts.length !== 2) {
    throw AppError.badRequest('El formato del correo electrónico es inválido');
  }

  const domain = parts[1].toLowerCase();

  if (domain === 'soy.sena.edu.co' || domain === 'misena.edu.co') {
    return 'APRENDIZ';
  } else if (domain === 'sena.edu.co') {
    return 'INSTRUCTOR';
  } else if (domain === 'gmail.com') {
    return 'APRENDIZ';
  } else {
    throw AppError.badRequest('El dominio del correo no está permitido para registro');
  }
};

module.exports = {
  resolveRoleFromEmail,
};
