const dashboardService = require('../services/dashboardService');
const catchAsync = require('../../../utils/catchAsync');
const ApiResponse = require('../../../utils/response');

exports.getLearnerDashboard = catchAsync(async (req, res) => {
  const dashboard = await dashboardService.getLearnerDashboard(req.user);
  ApiResponse.success(res, dashboard, 'Dashboard obtenido exitosamente');
});