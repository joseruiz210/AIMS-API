const matriculaService = require('../services/matriculaService');
const { success, created, paginated } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class MatriculaController {
  getAll = catchAsync(async (req, res) => {
    const { matriculas, pagination } = await matriculaService.findAll(req.query);
    return paginated(res, matriculas, pagination, 'Matrículas obtenidas exitosamente');
  });

  getById = catchAsync(async (req, res) => {
    const matricula = await matriculaService.findById(req.params.id);
    return success(res, matricula, 'Matrícula obtenida exitosamente');
  });

  create = catchAsync(async (req, res) => {
    const matricula = await matriculaService.create(req.body);
    return created(res, matricula, 'Matrícula registrada exitosamente');
  });

  update = catchAsync(async (req, res) => {
    const matricula = await matriculaService.update(req.params.id, req.body);
    return success(res, matricula, 'Matrícula actualizada exitosamente');
  });

  delete = catchAsync(async (req, res) => {
    await matriculaService.delete(req.params.id);
    return success(res, null, 'Matrícula eliminada exitosamente');
  });
}

module.exports = new MatriculaController();
