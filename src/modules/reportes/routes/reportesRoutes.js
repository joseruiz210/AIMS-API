const { Router } = require('express');
const reportesController = require('../controllers/reportesController');
const { authenticate, authorize } = require('../../../middlewares/auth');

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPERADMIN', 'INSTRUCTOR'));

router.get('/exportar', reportesController.exportarReporte);
router.get('/matriculas-mensuales', reportesController.getMatriculasMensuales);
router.get('/asistencia-consolidada', reportesController.getAsistenciaConsolidada);
router.get('/academico', reportesController.getAcademico);
router.get('/casos-riesgo', reportesController.getCasosRiesgo);

router.get('/fichas/:fichaId/notas', reportesController.getNotasFicha);
router.get('/fichas/:fichaId/asistencia', reportesController.getAsistenciaFicha);

module.exports = router;