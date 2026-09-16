const Joi = require('joi');

// OJO: acepta 'EXCUSA' y 'EXCUSADO' porque el código del proyecto usa ambos
// nombres en distintos lugares (revisar el enum real en schema.prisma y
// dejar solo uno). Ver nota en el resumen del chat.
const registroItem = Joi.object({
  aprendizId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del aprendiz es obligatorio',
  }),
  estado: Joi.string().valid('PRESENTE', 'AUSENTE', 'EXCUSA', 'EXCUSADO').required().messages({
    'any.only': 'El estado debe ser PRESENTE, AUSENTE o EXCUSA',
    'string.empty': 'El estado de asistencia es obligatorio',
  }),
  observacion: Joi.string().trim().allow(null, '').optional(),
});

const registroLegacy = Joi.object({
  fichaAprendizId: Joi.string().uuid().required(),
  horarioId: Joi.string().uuid().optional(),
  fecha: Joi.date().iso().optional(),
  estado: Joi.string().valid('PRESENTE', 'AUSENTE', 'EXCUSA', 'EXCUSADO').required(),
  observacion: Joi.string().trim().allow(null, '').optional(),
});

const registrarSesion = Joi.object({
  fichaId: Joi.string().uuid().optional().messages({
    'string.empty': 'El ID de la ficha no puede estar vacío',
  }),
  fecha: Joi.date().iso().optional(),
  tema: Joi.string().trim().min(3).max(150).optional().messages({
    'string.min': 'El tema de la sesión debe tener al menos 3 caracteres',
  }),
  asistencias: Joi.array().items(registroItem).min(1).optional().messages({
    'array.min': 'Debe enviar al menos un registro de asistencia',
  }),
  registros: Joi.alternatives()
    .try(
      Joi.array().items(registroItem).min(1),
      Joi.array().items(registroLegacy).min(1)
    )
    .optional(),
}).custom((value, helpers) => {
  const lista = value.asistencias || value.registros;
  if (!lista) return helpers.error('any.custom');
  const isLegacy = lista.every((item) => item.fichaAprendizId);
  if (!value.fichaId && !isLegacy) return helpers.error('any.custom');
  if (value.fichaId && isLegacy) return helpers.error('any.custom');
  return value;
}).messages({
  'any.custom': 'Debe enviar fichaId con aprendices o el formato legacy fichaAprendizId',
});
const fichaIdParam = Joi.object({
  fichaId: Joi.string().uuid().required().messages({
    'string.guid': 'El ID de la ficha debe ser un UUID válido',
  }),
});

module.exports = {
  registrarSesion,
  fichaIdParam,
};