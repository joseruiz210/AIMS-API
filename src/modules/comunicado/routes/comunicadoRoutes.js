const { Router } = require('express');
const comunicadoController = require('../controllers/comunicadoController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const comunicadoValidator = require('../validators/comunicadoValidator');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comunicados
 *   description: Difusión Institucional y Mensajes Oficiales
 */

router.get('/', authenticate, comunicadoController.getAll);
router.post('/:id/read', authenticate, comunicadoController.markRead);

router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'INSTRUCTOR'),
  validate({ body: comunicadoValidator.createComunicado }),
  comunicadoController.create
);

module.exports = router;
