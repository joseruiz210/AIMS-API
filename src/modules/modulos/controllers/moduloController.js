const moduloService = require('../services/moduloService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getAll = catchAsync(async (req, res) => {
  const modulos = await moduloService.getAll(req.query);
  ApiResponse.success(res, modulos, 'Lista de módulos obtenida exitosamente');
});

exports.getById = catchAsync(async (req, res) => {
  const modulo = await moduloService.getById(req.params.id);
  ApiResponse.success(res, modulo, 'Módulo obtenido exitosamente');
});

exports.create = catchAsync(async (req, res) => {
  const modulo = await moduloService.create(req.user.id, req.body);
  ApiResponse.created(res, modulo, 'Módulo creado exitosamente');
});

exports.update = catchAsync(async (req, res) => {
  const modulo = await moduloService.update(req.user.id, req.params.id, req.body);
  ApiResponse.success(res, modulo, 'Módulo actualizado exitosamente');
});

exports.delete = catchAsync(async (req, res) => {
  await moduloService.delete(req.user.id, req.params.id);
  ApiResponse.success(res, null, 'Módulo eliminado exitosamente');
});
