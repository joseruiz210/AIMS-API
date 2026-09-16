const Joi = require('joi');

const createHorario = Joi.object({
  fichaId: Joi.string().uuid().required().messages({
    'string.guid': 'El fichaId debe ser un UUID válido',
    'any.required': 'El fichaId es requerido',
  }),
  diaSemana: Joi.number().integer().min(1).max(7).required().messages({
    'number.min': 'El día de la semana debe ser entre 1 (Lunes) y 7 (Domingo)',
    'number.max': 'El día de la semana debe ser entre 1 (Lunes) y 7 (Domingo)',
    'any.required': 'El día de la semana es requerido',
  }),
  horaInicio: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'La horaInicio debe tener formato HH:mm (ej. 07:00)',
      'any.required': 'La horaInicio es requerida',
    }),
  horaFin: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'La horaFin debe tener formato HH:mm (ej. 12:00)',
      'any.required': 'La horaFin es requerida',
    }),
  ambiente: Joi.string().trim().max(100).allow(null, '').optional(),
  tema: Joi.string().trim().max(200).allow(null, '').optional(),
});

module.exports = {
  createHorario,
};
