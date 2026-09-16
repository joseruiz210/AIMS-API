const Joi = require('joi');

// destinatario ya no lo escribe el usuario: se calcula en el service a
// partir de si hay fichaId (aviso de ficha) o no (aviso global de admin).
const createComunicado = Joi.object({
  titulo: Joi.string().trim().min(3).required().messages({
    'string.empty': 'El asunto/título es obligatorio',
  }),
  mensaje: Joi.string().trim().min(5).required().messages({
    'string.empty': 'El cuerpo del mensaje es obligatorio',
  }),
  fichaId: Joi.string().uuid().optional().messages({
    'string.guid': 'El ID de la ficha debe ser un UUID válido',
  }),
});

module.exports = {
  createComunicado,
};
