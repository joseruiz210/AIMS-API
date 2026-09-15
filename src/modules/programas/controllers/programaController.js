const programaService = require('../services/programaService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getAll = catchAsync(async (req, res) => {
  const programas = await programaService.getAll();
  ApiResponse.success(res, programas, 'Programas de formación obtenidos exitosamente');
});

exports.getById = catchAsync(async (req, res) => {
  const programa = await programaService.getById(req.params.id);
  ApiResponse.success(res, programa, 'Programa obtenido exitosamente');
});

exports.create = catchAsync(async (req, res) => {
  const nuevoPrograma = await programaService.create(req.user.id, req.body);
  ApiResponse.created(res, nuevoPrograma, 'Programa creado exitosamente');
});

exports.update = catchAsync(async (req, res) => {
  const programaActualizado = await programaService.update(req.user.id, req.params.id, req.body);
  ApiResponse.success(res, programaActualizado, 'Programa actualizado exitosamente');
});

exports.delete = catchAsync(async (req, res) => {
  await programaService.delete(req.user.id, req.params.id);
  ApiResponse.success(res, null, 'Programa eliminado exitosamente');
});
