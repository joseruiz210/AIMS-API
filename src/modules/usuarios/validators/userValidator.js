const Joi = require('joi');

const ROLES = ['ADMIN', 'INSTRUCTOR', 'APRENDIZ'];

const id = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'El ID debe ser un UUID válido',
    'any.required': 'El ID es requerido',
  }),
});

const updateUser = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres',
  }),
  lastName: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede exceder 50 caracteres',
  }),
  email: Joi.string().trim().lowercase().email().messages({
    'string.email': 'Debe proporcionar un email válido',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[\d\s-]{7,15}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Debe proporcionar un número de teléfono válido',
    }),
  role: Joi.string()
    .valid(...ROLES)
    .messages({
      'any.only': `El rol debe ser uno de: ${ROLES.join(', ')}`,
    }),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

const queryUsers = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'La página debe ser al menos 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.min': 'El límite debe ser al menos 1',
    'number.max': 'El límite no puede exceder 100',
  }),
  role: Joi.string()
    .valid(...ROLES)
    .messages({
      'any.only': `El rol debe ser uno de: ${ROLES.join(', ')}`,
    }),
  isActive: Joi.boolean(),
  search: Joi.string().trim().max(100),
  sortBy: Joi.string()
    .valid('firstName', 'lastName', 'email', 'createdAt')
    .default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

const createUser = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'El nombre es obligatorio',
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'El apellido es obligatorio',
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'El email es obligatorio',
    'string.email': 'Debe proporcionar un email válido',
  }),
  password: Joi.string().min(8).max(100).optional(),
  role: Joi.string().valid(...ROLES).optional(),
  phone: Joi.string().trim().allow(null, '').optional(),
  especialidad: Joi.string().trim().allow(null, '').optional(),
});

module.exports = {
  createUser,
  updateUser,
  queryUsers,
  id,
};
