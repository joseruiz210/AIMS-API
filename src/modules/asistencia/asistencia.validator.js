const Joi = require('joi');

const ESTADOS_ASISTENCIA = ['PRESENTE', 'AUSENTE', 'TARDANZA', 'EXCUSA'];

const registroItem = Joi.object({
  fichaAprendizId: Joi.string().uuid().required().messages({
    'string.guid': 'El fichaAprendizId debe ser un UUID válido',
    'any.required': 'El fichaAprendizId es requerido',
  }),
  horarioId: Joi.string().uuid().required().messages({
    'string.guid': 'El horarioId debe ser un UUID válido',
    'any.required': 'El horarioId es requerido',
  }),
  fecha: Joi.date().iso().required().messages({
    'date.format': 'La fecha debe ser en formato ISO válido',
    'any.required': 'La fecha es requerida',
  }),
  estado: Joi.string()
    .valid(...ESTADOS_ASISTENCIA)
    .default('PRESENTE')
    .messages({
      'any.only': `El estado debe ser uno de: ${ESTADOS_ASISTENCIA.join(', ')}`,
    }),
  observacion: Joi.string().trim().max(255).allow(null, '').optional(),
});

const registrarAsistencia = Joi.object({
  registros: Joi.array().items(registroItem).min(1).required().messages({
    'array.min': 'Debe enviar al menos un registro de asistencia',
    'any.required': 'El campo registros es requerido',
  }),
  fichaId: Joi.string().uuid().optional(),
  fecha: Joi.date().iso().optional(),
  tema: Joi.string().allow(null, '').optional(),
  asistencias: Joi.array().items(
    Joi.object({
      aprendizId: Joi.string().uuid().required(),
      estado: Joi.string().valid(...ESTADOS_ASISTENCIA).default('PRESENTE'),
      observacion: Joi.string().trim().max(255).allow(null, '').optional(),
    })
  ).optional(),
  registros: Joi.array().items(
    Joi.object({
      fichaAprendizId: Joi.string().uuid().optional(),
      aprendizId: Joi.string().uuid().optional(),
      horarioId: Joi.string().uuid().optional(),
      fecha: Joi.date().iso().optional(),
      estado: Joi.string().valid(...ESTADOS_ASISTENCIA).default('PRESENTE'),
      observacion: Joi.string().trim().max(255).allow(null, '').optional(),
    })
  ).optional(),
}).or('asistencias', 'registros').messages({
  'object.missing': 'Debe enviar al menos el arreglo de asistencias o registros',
});

module.exports = {
  registrarAsistencia,
};
