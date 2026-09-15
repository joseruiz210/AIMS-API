const Joi = require('joi');

const createModulo = Joi.object({
  nombre: Joi.string().trim().min(3).max(150).required().messages({
    'string.empty': 'El nombre del módulo es requerido',
    'string.min': 'El nombre del módulo debe tener al menos 3 caracteres',
    'string.max': 'El nombre del módulo no puede exceder 150 caracteres',
    'any.required': 'El nombre del módulo es requerido',
  }),
  horasFormacion: Joi.number().integer().min(1).max(1000).required().messages({
    'number.min': 'Las horas de formación deben ser al menos 1',
    'number.max': 'Las horas de formación no pueden exceder 1000',
    'any.required': 'Las horas de formación son requeridas',
  }),
  programaId: Joi.string().uuid().required().messages({
    'string.guid': 'El programaId debe ser un UUID válido',
    'any.required': 'El programaId es requerido',
  }),
});

const updateModulo = Joi.object({
  nombre: Joi.string().trim().min(3).max(150),
  horasFormacion: Joi.number().integer().min(1).max(1000),
  programaId: Joi.string().uuid(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

const queryModulo = Joi.object({
  programaId: Joi.string().uuid().optional(),
});

const idParam = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'El ID debe ser un UUID válido',
    'any.required': 'El ID es requerido',
  }),
});

module.exports = {
  createModulo,
  updateModulo,
  queryModulo,
  idParam,
};
