const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder los 50 caracteres',
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'El apellido es obligatorio',
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede exceder los 50 caracteres',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'El email es obligatorio',
    'string.email': 'Debe ingresar un email válido',
  }),
  password: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'La contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    }),
  phone: Joi.string().trim().allow(null, '').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'El email es obligatorio',
    'string.email': 'Debe ingresar un email válido',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'La contraseña es obligatoria',
  }),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().trim().required().messages({
    'string.empty': 'El token de verificación es obligatorio',
  }),
});

const emailOnlySchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'El email es obligatorio',
    'string.email': 'Debe ingresar un email válido',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().required().messages({
    'string.empty': 'El token es obligatorio',
  }),
  newPassword: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'La nueva contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required().messages({
    'string.empty': 'El refresh token es obligatorio',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'La contraseña actual es obligatoria',
  }),
  newPassword: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'La nueva contraseña es obligatoria',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número',
    }),
});

const googleLoginSchema = Joi.object({
  idToken: Joi.string().trim().required().messages({
    'string.empty': 'El token de Google es obligatorio',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  emailOnlySchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
  googleLoginSchema,
};
