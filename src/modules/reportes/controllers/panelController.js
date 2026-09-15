const reportesService = require('../services/reportesService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getStats = catchAsync(async (req, res) => {
  const stats = await reportesService.getDashboardStats();
  ApiResponse.success(res, stats, 'Estadísticas del panel obtenidas exitosamente');
});

exports.getRecentActivity = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const activity = await reportesService.getRecentActivity(limit);
  ApiResponse.success(res, activity, 'Actividad reciente obtenida exitosamente');
});