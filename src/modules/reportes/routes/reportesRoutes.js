const { Router } = require('express');
const reportesController = require('../controllers/reportesController');
const { authenticate, authorize } = require('../../../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/matriculas-mensuales', authorize('ADMIN', 'SUPERADMIN'), reportesController.getMatriculasMensuales);
router.get('/casos-riesgo', authorize('ADMIN', 'SUPERADMIN'), reportesController.getCasosRiesgo);

router.get('/fichas/:fichaId/notas', authorize('ADMIN', 'SUPERADMIN', 'INSTRUCTOR'), reportesController.getNotasFicha);
router.get('/fichas/:fichaId/asistencia', authorize('ADMIN', 'SUPERADMIN', 'INSTRUCTOR'), reportesController.getAsistenciaFicha);

module.exports = router;