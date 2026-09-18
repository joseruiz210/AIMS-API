const notificacionService = require('../services/notificacionService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getMisNotificaciones = catchAsync(async (req, res) => {
  const data = await notificacionService.getMisNotificaciones(req.user.id);
  ApiResponse.success(res, data, 'Notificaciones obtenidas exitosamente');
});

exports.markAsRead = catchAsync(async (req, res) => {
  await notificacionService.markAsRead(req.params.id, req.user.id);
  ApiResponse.success(res, null, 'Notificación marcada como leída');
});

exports.markAllAsRead = catchAsync(async (req, res) => {
  await notificacionService.markAllAsRead(req.user.id);
  ApiResponse.success(res, null, 'Todas las notificaciones marcadas como leídas');
});

exports.enviarGlobal = catchAsync(async (req, res) => {
  const { title, body, tipo, targetRole } = req.body;
  if (!title || !body) {
    return ApiResponse.badRequest(res, 'El título y el cuerpo del mensaje son requeridos');
  }
  const result = await notificacionService.notifyGlobal({ title, body, tipo, targetRole });
  ApiResponse.success(res, result, 'Notificación global enviada exitosamente');
});
