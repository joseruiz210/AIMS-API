const Joi = require('joi');

const createObservacion = Joi.object({
  aprendizId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del aprendiz es obligatorio',
  }),
  tipo: Joi.string().valid('Felicitacion', 'Academica', 'Disciplinaria', 'FELICITACION', 'ACADEMICA', 'DISCIPLINARIA', 'RECONOCIMIENTO', 'OTRO').required().messages({
    'string.empty': 'El tipo de observación es obligatorio',
  }),
  materia: Joi.string().trim().optional(),
  descripcion: Joi.string().trim().min(5).required().messages({
    'string.empty': 'La descripción es obligatoria',
  }),
  fecha: Joi.date().iso().optional(),
});

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createObservacion,
  idParam,
};
