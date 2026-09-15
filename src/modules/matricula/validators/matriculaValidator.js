const Joi = require('joi');

const createMatricula = Joi.object({
  fichaId: Joi.string().uuid().required().messages({
    'string.empty': 'La ficha es obligatoria',
    'string.guid': 'El ID de la ficha debe ser un UUID válido',
  }),
  aprendizId: Joi.string().uuid().required().messages({
    'string.empty': 'El aprendiz es obligatorio',
    'string.guid': 'El ID del aprendiz debe ser un UUID válido',
  }),
  fechaMatricula: Joi.date().iso().optional(),
  estado: Joi.string().valid('Activo', 'Pendiente', 'Retirado').optional(),
});

const updateMatricula = Joi.object({
  fichaId: Joi.string().uuid().optional(),
  aprendizId: Joi.string().uuid().optional(),
  fechaMatricula: Joi.date().iso().optional(),
  estado: Joi.string().valid('Activo', 'Pendiente', 'Retirado').optional(),
}).min(1);

const idParam = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'El ID debe ser un UUID válido',
  }),
});

module.exports = {
  createMatricula,
  updateMatricula,
  idParam,
};
