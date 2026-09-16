const observacionService = require('../services/observacionService');
const { success, created } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class ObservacionController {
  create = catchAsync(async (req, res) => {
    const obs = await observacionService.create(req.user.id, req.body);
    return created(res, obs, 'Observación registrada exitosamente');
  });

  getMyObservaciones = catchAsync(async (req, res) => {
    const observaciones = await observacionService.findMyObservaciones(req.user);
    return success(res, observaciones, 'Observaciones obtenidas exitosamente');
  });

  delete = catchAsync(async (req, res) => {
    await observacionService.delete(req.params.id);
    return success(res, null, 'Observación eliminada exitosamente');
  });
}

module.exports = new ObservacionController();
