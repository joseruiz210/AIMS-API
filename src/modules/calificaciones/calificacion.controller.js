const calificacionService = require('./calificacion.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/response');

exports.getMisCalificaciones = catchAsync(async (req, res) => {
  const data = await calificacionService.getMisCalificaciones(req.user.id);
  ApiResponse.success(res, data, 'Calificaciones obtenidas exitosamente');
});

exports.getCalificacionesByFicha = catchAsync(async (req, res) => {
  const { fichaId } = req.params;
  const data = await calificacionService.getCalificacionesByFicha(fichaId);
  ApiResponse.success(res, data, 'Calificaciones de la ficha obtenidas exitosamente');
});

exports.registrarCalificacion = catchAsync(async (req, res) => {
  const resultado = await calificacionService.registrarCalificacion(req.user.id, req.body);
  ApiResponse.created(res, resultado, 'Calificación registrada exitosamente');
});
