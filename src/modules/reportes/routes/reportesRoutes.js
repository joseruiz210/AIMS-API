const { Router } = require('express');
const reportesController = require('../controllers/reportesController');
const { authenticate, authorize } = require('../../../middlewares/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Generación y Exportación de Reportes Consolidados
 */

router.use(authenticate, authorize('ADMIN', 'SUPERADMIN'));
router.get('/matriculas-mensuales', reportesController.getMatriculasMensuales);
router.get('/asistencia-consolidada', reportesController.getAsistenciaConsolidada);
router.get('/academico', reportesController.getAcademico);
router.get('/casos-riesgo', reportesController.getCasosRiesgo);

module.exports = router;
