const horarioService = require('../services/horarioService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getMiHorario = catchAsync(async (req, res) => {
  const horario = await horarioService.getMiHorario(req.user.id);
  ApiResponse.success(res, horario, 'Horario obtenido exitosamente');
});

exports.create = catchAsync(async (req, res) => {
  const nuevoHorario = await horarioService.create(req.user.id, req.body);
  ApiResponse.created(res, nuevoHorario, 'Franja horaria creada exitosamente');
});
