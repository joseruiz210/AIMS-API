const { Router } = require('express');
const matriculaController = require('../controllers/matriculaController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const matriculaValidator = require('../validators/matriculaValidator');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Matriculas
 *   description: Gestión de Matrículas Académicas de Aprendices
 */

router.get('/', authenticate, matriculaController.getAll);
router.get('/:id', authenticate, validate({ params: matriculaValidator.idParam }), matriculaController.getById);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: matriculaValidator.createMatricula }),
  matriculaController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: matriculaValidator.idParam, body: matriculaValidator.updateMatricula }),
  matriculaController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: matriculaValidator.idParam }),
  matriculaController.delete
);

module.exports = router;
