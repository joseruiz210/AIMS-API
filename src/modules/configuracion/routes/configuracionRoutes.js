const { Router } = require('express');
const configuracionController = require('../controllers/configuracionController');
const { authenticate, authorize } = require('../../../middlewares/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Configuracion
 *   description: Parámetros e Información de la Institución SENA
 */

router.get('/', authenticate, configuracionController.get);
router.put('/', authenticate, authorize('ADMIN'), configuracionController.update);

module.exports = router;
