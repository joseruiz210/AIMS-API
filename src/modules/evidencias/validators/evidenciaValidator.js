const Joi = require('joi');

const createEvidencia = Joi.object({
  titulo: Joi.string().trim().min(3).max(200).required().messages({
    'string.empty': 'El título es requerido',
    'any.required': 'El título es requerido',
  }),
  descripcion: Joi.string().trim().min(5).required().messages({
    'string.empty': 'La descripción es requerida',
    'any.required': 'La descripción es requerida',
  }),
  fechaLimite: Joi.date().iso().required().messages({
    'date.format': 'La fecha límite debe ser en formato ISO válido',
    'any.required': 'La fecha límite es requerida',
  }),
  fichaId: Joi.string().uuid().required().messages({
    'string.guid': 'El fichaId debe ser un UUID válido',
    'any.required': 'El fichaId es requerido',
  }),
});

const updateEvidencia = Joi.object({
  titulo: Joi.string().trim().min(3).max(200),
  descripcion: Joi.string().trim().min(5),
  fechaLimite: Joi.date().iso(),
  fichaId: Joi.string().uuid(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

const entregarEvidencia = Joi.object({
  archivoUrl: Joi.string().trim().allow(null, '').optional(),
  comentario: Joi.string().trim().max(1000).allow(null, '').optional(),
});

const calificarEntrega = Joi.object({
  nota: Joi.number().min(0.0).max(5.0).required().messages({
    'number.min': 'La nota mínima es 0.0',
    'number.max': 'La nota máxima es 5.0',
    'any.required': 'La nota es requerida',
  }),
});

const idParam = Joi.object({
  id: Joi.string().trim().required().messages({
    'string.empty': 'El ID es requerido',
    'any.required': 'El ID es requerido',
  }),
});

const entregaIdParam = Joi.object({
  id: Joi.string().trim().required(),
  entregaId: Joi.string().trim().required(),
});

module.exports = {
  createEvidencia,
  updateEvidencia,
  entregarEvidencia,
  calificarEntrega,
  idParam,
  entregaIdParam,
};
