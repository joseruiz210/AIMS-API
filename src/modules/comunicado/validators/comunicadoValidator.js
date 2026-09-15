const Joi = require('joi');

const createComunicado = Joi.object({
  destinatario: Joi.string().trim().required().messages({
    'string.empty': 'El destinatario es obligatorio',
  }),
  titulo: Joi.string().trim().min(3).required().messages({
    'string.empty': 'El asunto/título es obligatorio',
  }),
  mensaje: Joi.string().trim().min(5).required().messages({
    'string.empty': 'El cuerpo del mensaje es obligatorio',
  }),
});

module.exports = {
  createComunicado,
};
