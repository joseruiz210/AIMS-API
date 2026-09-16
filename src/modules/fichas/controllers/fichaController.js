const fichaService = require('../services/fichaService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getAll = catchAsync(async (req, res) => {
  const fichas = await fichaService.getAll(req.user);
  ApiResponse.success(res, fichas, 'Fichas obtenidas exitosamente');
});

exports.getById = catchAsync(async (req, res) => {
  const ficha = await fichaService.getById(req.params.id, req.user);
  ApiResponse.success(res, ficha, 'Ficha obtenida exitosamente');
});

exports.create = catchAsync(async (req, res) => {
  const nuevaFicha = await fichaService.create(req.user.id, req.body);
  ApiResponse.created(res, nuevaFicha, 'Ficha creada exitosamente');
});

exports.update = catchAsync(async (req, res) => {
  const fichaActualizada = await fichaService.update(req.user.id, req.params.id, req.body, req.user.role);
  ApiResponse.success(res, fichaActualizada, 'Ficha actualizada exitosamente');
});

exports.delete = catchAsync(async (req, res) => {
  await fichaService.delete(req.user.id, req.params.id);
  ApiResponse.success(res, null, 'Ficha eliminada exitosamente');
});

exports.addAprendiz = catchAsync(async (req, res) => {
  const { aprendizId } = req.body;
  const relacion = await fichaService.addAprendiz(req.user.id, req.params.id, aprendizId);
  ApiResponse.created(res, relacion, 'Aprendiz matriculado en la ficha exitosamente');
});

exports.removeAprendiz = catchAsync(async (req, res) => {
  const { aprendizId } = req.params;
  await fichaService.removeAprendiz(req.user.id, req.params.id, aprendizId);
  ApiResponse.success(res, null, 'Aprendiz retirado de la ficha exitosamente');
});

exports.importAprendices = catchAsync(async (req, res) => {
  const carga = await fichaService.importAprendices(req.user.id, req.params.id, req.file, req.user);
  ApiResponse.created(res, carga, 'Aprendices cargados en la ficha exitosamente');
});

exports.importAprendicesGeneral = catchAsync(async (req, res) => {
  const carga = await fichaService.importAprendicesGeneral(req.user.id, req.file, req.user);
  ApiResponse.created(res, carga, 'Fichas y aprendices cargados exitosamente');
});

exports.assignInstructor = catchAsync(async (req, res) => {
  const assignment = await fichaService.assignInstructor(req.user.id, req.params.id, req.body.instructorId, req.body.isLeader);
  ApiResponse.created(res, assignment, 'Instructor asignado a la ficha exitosamente');
});

exports.setLeader = catchAsync(async (req, res) => {
  const assignment = await fichaService.setLeader(req.user.id, req.params.id, req.body.instructorId);
  ApiResponse.success(res, assignment, 'Instructor líder actualizado exitosamente');
});

exports.removeInstructor = catchAsync(async (req, res) => {
  await fichaService.removeInstructor(req.user.id, req.params.id, req.params.instructorId);
  ApiResponse.success(res, null, 'Instructor retirado de la ficha exitosamente');
});
