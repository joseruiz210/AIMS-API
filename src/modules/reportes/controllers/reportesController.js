const reportesService = require('../services/reportesService');
const { success } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');

class ReportesController {
  getMatriculasMensuales = catchAsync(async (req, res) => {
    const monthlyData = await reportesService.getMatriculasMensuales();
    return success(res, monthlyData, 'Matrículas mensuales obtenidas exitosamente');
  });

  getNotasFicha = catchAsync(async (req, res) => {
    const { fichaId } = req.params;
    const format = (req.query.format || 'pdf').toLowerCase();
    if (!['pdf', 'xlsx'].includes(format)) throw AppError.badRequest('Formato debe ser pdf o xlsx');
    const result = await reportesService.generateNotasFichaReport(fichaId, format, req.user);
    return success(res, result, 'Reporte de notas generado exitosamente');
  });

  getAsistenciaFicha = catchAsync(async (req, res) => {
    const { fichaId } = req.params;
    const format = (req.query.format || 'pdf').toLowerCase();
    const { fecha } = req.query;
    if (!['pdf', 'xlsx'].includes(format)) throw AppError.badRequest('Formato debe ser pdf o xlsx');
    const result = await reportesService.generateAsistenciaFichaReport(fichaId, format, fecha, req.user);
    return success(res, result, 'Reporte de asistencia generado exitosamente');
  });

  getAsistenciaConsolidada = catchAsync(async (req, res) => {
    return success(
      res,
      { downloadUrl: '/api/v1/reportes/exportar?type=asistencia', format: 'PDF' },
      'Reporte consolidado de asistencia generado'
    );
  });

  getAcademico = catchAsync(async (req, res) => {
    return success(
      res,
      { downloadUrl: '/api/v1/reportes/exportar?type=academico', format: 'PDF' },
      'Reporte académico generado'
    );
  });

  getCasosRiesgo = catchAsync(async (req, res) => {
    return success(
      res,
      { downloadUrl: '/api/v1/reportes/exportar?type=riesgo', format: 'PDF' },
      'Reporte de casos en seguimiento generado'
    );
  });

  exportarReporte = catchAsync(async (req, res) => {
    const { type = 'asistencia' } = req.query;
    const { buffer, filename } = await reportesService.exportarReportePDF(type);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  });
}

module.exports = new ReportesController();