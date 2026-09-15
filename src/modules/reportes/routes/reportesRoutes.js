const { Router } = require('express');
const reportesController = require('../controllers/reportesController');
const { authenticate } = require('../../../middlewares/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Generación y Exportación de Reportes Consolidados
 */

router.get('/matriculas-mensuales', authenticate, reportesController.getMatriculasMensuales);
router.get('/asistencia-consolidada', authenticate, reportesController.getAsistenciaConsolidada);
router.get('/academico', authenticate, reportesController.getAcademico);
router.get('/casos-riesgo', authenticate, reportesController.getCasosRiesgo);

module.exports = router;
