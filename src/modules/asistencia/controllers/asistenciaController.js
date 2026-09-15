const asistenciaService = require('../services/asistenciaService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getMisAsistencias = catchAsync(async (req, res) => {
  const data = await asistenciaService.getMisAsistencias(req.user.id);
  ApiResponse.success(res, data, 'Datos de asistencia del aprendiz obtenidos exitosamente');
});

exports.getAsistenciasByFicha = catchAsync(async (req, res) => {
  const { fichaId } = req.params;
  const { fecha } = req.query;
  const data = await asistenciaService.getAsistenciasByFicha(fichaId, fecha);
  ApiResponse.success(res, data, 'Asistencias de la ficha obtenidas exitosamente');
});

exports.registrarAsistencia = catchAsync(async (req, res) => {
  const resultado = await asistenciaService.registrarAsistenciaSesion(req.user.id, req.body);
  ApiResponse.created(res, resultado, 'Asistencias registradas exitosamente');
});
