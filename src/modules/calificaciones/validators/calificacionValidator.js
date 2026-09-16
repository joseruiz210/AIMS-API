const Joi = require('joi');

const registrarCalificacion = Joi.object({
  aprendizId: Joi.string().uuid().required().messages({
    'string.guid': 'El aprendizId debe ser un UUID válido',
    'any.required': 'El aprendizId es requerido',
  }),
  fichaId: Joi.string().uuid().required().messages({
    'string.guid': 'El fichaId debe ser un UUID válido',
    'any.required': 'El fichaId es requerido',
  }),
  competenciaId: Joi.string().uuid().optional(),
  moduloId: Joi.string().uuid().optional(),
  nota: Joi.number().min(0.0).max(5.0).required().messages({
    'number.min': 'La nota mínima es 0.0',
    'number.max': 'La nota máxima es 5.0',
    'any.required': 'La nota es requerida',
  }),
  periodo: Joi.string().trim().max(20).optional().default('2026-1'),
});

module.exports = {
  registrarCalificacion,
};
