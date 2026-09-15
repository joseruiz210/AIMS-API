const comunicadoService = require('../services/comunicadoService');
const { success, created } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class ComunicadoController {
  create = catchAsync(async (req, res) => {
    const comunicado = await comunicadoService.create(req.user.id, req.body);
    return created(res, comunicado, 'Comunicado enviado exitosamente');
  });

  getAll = catchAsync(async (req, res) => {
    const comunicados = await comunicadoService.findAll();
    return success(res, comunicados, 'Comunicados obtenidos exitosamente');
  });

  markRead = catchAsync(async (req, res) => {
    await comunicadoService.registerLectura(req.params.id, req.user.id);
    return success(res, null, 'Comunicado marcado como leído');
  });
}

module.exports = new ComunicadoController();
