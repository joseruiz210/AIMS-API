const horarioService = require('../services/horarioService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getMiHorario = catchAsync(async (req, res) => {
  const horario = await horarioService.getMiHorario(req.user.id);
  ApiResponse.success(res, horario, 'Horario obtenido exitosamente');
});

exports.getByFicha = catchAsync(async (req, res) => {
  const horarios = await horarioService.getByFicha(req.params.fichaId);
  ApiResponse.success(res, horarios, 'Horarios de la ficha obtenidos exitosamente');
});

exports.create = catchAsync(async (req, res) => {
  const nuevoHorario = await horarioService.create(req.user.id, req.body);
  ApiResponse.created(res, nuevoHorario, 'Franja horaria creada exitosamente');
});

exports.update = catchAsync(async (req, res) => {
  const actualizado = await horarioService.update(req.user.id, req.params.id, req.body);
  ApiResponse.success(res, actualizado, 'Franja horaria actualizada exitosamente');
});

exports.delete = catchAsync(async (req, res) => {
  await horarioService.delete(req.user.id, req.params.id);
  ApiResponse.success(res, null, 'Franja horaria eliminada exitosamente');
});
