const Joi = require('joi');

const JORNADAS = ['MANANA', 'TARDE', 'NOCHE', 'MIXTA'];

const createFicha = Joi.object({
  numero: Joi.string().trim().min(3).max(50).required().messages({
    'string.empty': 'El número de ficha es requerido',
    'any.required': 'El número de ficha es requerido',
  }),
  jornada: Joi.string()
    .valid(...JORNADAS)
    .required()
    .messages({
      'any.only': `La jornada debe ser una de: ${JORNADAS.join(', ')}`,
      'any.required': 'La jornada es requerida',
    }),
  fechaInicio: Joi.date().iso().required().messages({
    'date.format': 'La fecha de inicio debe tener formato ISO válido',
    'any.required': 'La fecha de inicio es requerida',
  }),
  fechaFin: Joi.date().iso().allow(null, '').optional(),
  programaId: Joi.string().uuid().required().messages({
    'string.guid': 'El programaId debe ser un UUID válido',
    'any.required': 'El programaId es requerido',
  }),
  instructorId: Joi.string().uuid().allow(null, '').optional().messages({
    'string.guid': 'El instructorId debe ser un UUID válido',
  }),
  isActive: Joi.boolean().optional(),
});

const updateFicha = Joi.object({
  numero: Joi.string().trim().min(3).max(50),
  jornada: Joi.string().valid(...JORNADAS),
  fechaInicio: Joi.date().iso(),
  fechaFin: Joi.date().iso().allow(null, ''),
  programaId: Joi.string().uuid(),
  instructorId: Joi.string().uuid().allow(null, ''),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

const addAprendiz = Joi.object({
  aprendizId: Joi.string().uuid().required().messages({
    'string.guid': 'El aprendizId debe ser un UUID válido',
    'any.required': 'El aprendizId es requerido',
  }),
});

const idParam = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'El ID debe ser un UUID válido',
    'any.required': 'El ID es requerido',
  }),
});

const aprendizIdParam = Joi.object({
  id: Joi.string().uuid().required(),
  aprendizId: Joi.string().uuid().required(),
});

module.exports = {
  createFicha,
  updateFicha,
  addAprendiz,
  idParam,
  aprendizIdParam,
};
