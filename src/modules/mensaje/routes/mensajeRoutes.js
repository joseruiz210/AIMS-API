const { Router } = require('express');
const mensajeController = require('../controllers/mensajeController');
const { authenticate } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const mensajeValidator = require('../validators/mensajeValidator');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Mensajes
 *   description: Sistema de Mensajería Interna
 */

router.get('/', authenticate, mensajeController.getMyMensajes);
router.post('/', authenticate, validate({ body: mensajeValidator.sendMensaje }), mensajeController.send);
router.patch('/:id/read', authenticate, mensajeController.markRead);

module.exports = router;
