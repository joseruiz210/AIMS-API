const userService = require('../services/userService');
const { success, created, paginated } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class UserController {
  create = catchAsync(async (req, res) => {
    const user = await userService.create(req.body);
    return created(res, user, 'Usuario creado exitosamente');
  });

  createByAdmin = catchAsync(async (req, res) => {
    const user = await userService.createByAdmin(req.user.id, req.body);
    return created(res, user, 'Usuario creado exitosamente por el administrador');
  });

  getAll = catchAsync(async (req, res) => {
    const { users, pagination } = await userService.findAll(req.query);
    return paginated(res, users, pagination, 'Usuarios obtenidos exitosamente');
  });

  getById = catchAsync(async (req, res) => {
    const user = await userService.findById(req.params.id);
    return success(res, user, 'Usuario obtenido exitosamente');
  });

  getProfile = catchAsync(async (req, res) => {
    const user = await userService.getProfile(req.user.id);
    return success(res, user, 'Perfil obtenido exitosamente');
  });

  update = catchAsync(async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    return success(res, user, 'Usuario actualizado exitosamente');
  });

  updateProfile = catchAsync(async (req, res) => {
    const { role, isActive, ...safeData } = req.body;
    const user = await userService.update(req.user.id, safeData);
    return success(res, user, 'Perfil actualizado exitosamente');
  });

  delete = catchAsync(async (req, res) => {
    await userService.delete(req.params.id);
    return success(res, null, 'Usuario eliminado exitosamente');
  });

  toggleActive = catchAsync(async (req, res) => {
    const user = await userService.toggleActive(req.params.id);
    const status = user.isActive ? 'activado' : 'desactivado';
    return success(res, user, `Usuario ${status} exitosamente`);
  });

  updatePushToken = catchAsync(async (req, res) => {
    const { pushToken } = req.body;
    const user = await userService.updatePushToken(req.user.id, pushToken || null);
    return success(res, { pushToken: user.pushToken }, 'Token de notificación actualizado exitosamente');
  });
}

module.exports = new UserController();
