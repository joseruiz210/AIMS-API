const Joi = require('joi');

const createPrograma = Joi.object({
  nombre: Joi.string().trim().min(3).max(150).required().messages({
    'string.empty': 'El nombre del programa es requerido',
    'string.min': 'El nombre del programa debe tener al menos 3 caracteres',
    'string.max': 'El nombre del programa no puede exceder 150 caracteres',
    'any.required': 'El nombre del programa es requerido',
  }),
  codigo: Joi.string().trim().min(3).max(50).required().messages({
    'string.empty': 'El código del programa es requerido',
    'string.min': 'El código del programa debe tener al menos 3 caracteres',
    'string.max': 'El código del programa no puede exceder 50 caracteres',
    'any.required': 'El código del programa es requerido',
  }),
  duracionMeses: Joi.number().integer().min(1).max(60).required().messages({
    'number.base': 'La duración en meses debe ser un número',
    'number.min': 'La duración mínima debe ser 1 mes',
    'number.max': 'La duración máxima debe ser 60 meses',
    'any.required': 'La duración en meses es requerida',
  }),
});

const updatePrograma = Joi.object({
  nombre: Joi.string().trim().min(3).max(150),
  codigo: Joi.string().trim().min(3).max(50),
  duracionMeses: Joi.number().integer().min(1).max(60),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

const idParam = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'El ID debe ser un UUID válido',
    'any.required': 'El ID es requerido',
  }),
});

module.exports = {
  createPrograma,
  updatePrograma,
  idParam,
};
