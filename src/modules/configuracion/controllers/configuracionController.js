const configuracionService = require('../services/configuracionService');
const { success } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class ConfiguracionController {
  get = catchAsync(async (req, res) => {
    const config = await configuracionService.get();
    return success(res, config, 'Configuración institucional obtenida exitosamente');
  });

  update = catchAsync(async (req, res) => {
    const config = await configuracionService.update(req.body);
    return success(res, config, 'Configuración actualizada exitosamente');
  });
}

module.exports = new ConfiguracionController();
