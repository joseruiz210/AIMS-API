const evidenciaService = require('./evidencia.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/response');

exports.getAll = catchAsync(async (req, res) => {
  const evidencias = await evidenciaService.getAll(req.query, req.user);
  ApiResponse.success(res, evidencias, 'Lista de evidencias obtenida exitosamente');
});

exports.getById = catchAsync(async (req, res) => {
  const evidencia = await evidenciaService.getById(req.params.id);
  ApiResponse.success(res, evidencia, 'Evidencia obtenida exitosamente');
});

exports.create = catchAsync(async (req, res) => {
  const evidencia = await evidenciaService.create(req.user.id, req.body);
  ApiResponse.created(res, evidencia, 'Evidencia creada exitosamente');
});

exports.update = catchAsync(async (req, res) => {
  const evidencia = await evidenciaService.update(req.user.id, req.params.id, req.body);
  ApiResponse.success(res, evidencia, 'Evidencia actualizada exitosamente');
});

exports.delete = catchAsync(async (req, res) => {
  await evidenciaService.delete(req.user.id, req.params.id);
  ApiResponse.success(res, null, 'Evidencia eliminada exitosamente');
});

exports.entregar = catchAsync(async (req, res) => {
  const entrega = await evidenciaService.entregar(req.user.id, req.params.id, req.body);
  ApiResponse.created(res, entrega, 'Entrega enviada exitosamente');
});

exports.calificarEntrega = catchAsync(async (req, res) => {
  const entrega = await evidenciaService.calificarEntrega(req.user.id, req.params.entregaId, req.body.nota);
  ApiResponse.success(res, entrega, 'Entrega calificada exitosamente');
});

exports.getEntregas = catchAsync(async (req, res) => {
  const entregas = await evidenciaService.getEntregas(req.params.id);
  ApiResponse.success(res, entregas, 'Entregas obtenidas exitosamente');
});

exports.generarPropuestaIa = catchAsync(async (req, res) => {
  const propuesta = await evidenciaService.generarPropuestaIa(req.body);
  ApiResponse.success(res, propuesta, 'Propuesta de actividad generada exitosamente');
});
