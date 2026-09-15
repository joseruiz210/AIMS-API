const { success } = require('../../../utils/response');
const catchAsync = require('../../../utils/catchAsync');

class ReportesController {
  getMatriculasMensuales = catchAsync(async (req, res) => {
    const monthlyData = [
      { month: 'Feb', count: 48 },
      { month: 'Mar', count: 38 },
      { month: 'Abr', count: 52 },
      { month: 'May', count: 28 },
      { month: 'Jun', count: 55 },
      { month: 'Jul', count: 27 },
    ];
    return success(res, monthlyData, 'Matrículas mensuales obtenidas exitosamente');
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
}

module.exports = new ReportesController();
