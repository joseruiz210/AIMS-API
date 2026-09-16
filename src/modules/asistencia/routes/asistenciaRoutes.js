const { Router } = require('express');
const asistenciaController = require('../controllers/asistenciaController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const asistenciaValidator = require('../validators/asistenciaValidator');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Asistencia
 *   description: Control y Registro de Asistencia Académica
 */

// GET /asistencia/mis-asistencias -> coincide con asistenciaService.getMisAsistencias() del frontend
router.get('/mis-asistencias', authenticate, authorize('APRENDIZ'), asistenciaController.getMisAsistencias);

// GET /asistencia/ficha/:fichaId -> coincide con asistenciaService.getAsistenciasByFicha() del frontend
router.get(
  '/ficha/:fichaId',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERADMIN'),
  validate({ params: asistenciaValidator.fichaIdParam }),
  asistenciaController.getAsistenciasByFicha
);

// POST /asistencia/registrar -> coincide con asistenciaService.registrarAsistencia() del frontend
router.post(
  '/registrar',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN', 'SUPERADMIN'),
  validate({ body: asistenciaValidator.registrarSesion }),
  asistenciaController.registrarAsistencia
);

// NOTA: la ruta '/resumen' (getResumenGlobal) existía antes pero el controller
// nunca implementó esa función -> se quitó para no romper el router al cargar.
// Si el panel de ADMIN la necesita, hay que escribir ese método en el
// controller/service antes de volver a exponerla.

module.exports = router;