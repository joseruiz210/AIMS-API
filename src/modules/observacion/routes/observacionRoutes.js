const { Router } = require('express');
const observacionController = require('../controllers/observacionController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const observacionValidator = require('../validators/observacionValidator');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Observaciones
 *   description: Registro de Observaciones Académicas y Disciplinarias
 */

router.get('/', authenticate, observacionController.getMyObservaciones);

router.post(
  '/',
  authenticate,
  authorize('INSTRUCTOR', 'ADMIN'),
  validate({ body: observacionValidator.createObservacion }),
  observacionController.create
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  validate({ params: observacionValidator.idParam }),
  observacionController.delete
);

module.exports = router;
