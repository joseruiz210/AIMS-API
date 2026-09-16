const Joi = require('joi');

const sendMensaje = Joi.object({
  receptorId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del receptor es obligatorio',
  }),
  texto: Joi.string().trim().min(1).required().messages({
    'string.empty': 'El contenido del mensaje es obligatorio',
  }),
});

module.exports = {
  sendMensaje,
};
