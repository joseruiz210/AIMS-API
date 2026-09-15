const mensajeService = require('../services/mensajeService');
const { success, created } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class MensajeController {
  send = catchAsync(async (req, res) => {
    const mensaje = await mensajeService.send(req.user.id, req.body);
    return created(res, mensaje, 'Mensaje enviado exitosamente');
  });

  getMyMensajes = catchAsync(async (req, res) => {
    const list = await mensajeService.findMyMensajes(req.user.id);
    return success(res, list, 'Mensajes obtenidos exitosamente');
  });

  markRead = catchAsync(async (req, res) => {
    await mensajeService.markAsRead(req.params.id, req.user.id);
    return success(res, null, 'Mensaje marcado como leído');
  });
}

module.exports = new MensajeController();
