const { Router } = require('express');
const documentosController = require('../controllers/documentosController');
const { authenticate, authorize } = require('../../../middlewares/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documentos
 *   description: Certificados Oficiales, Carné Digital y Documentación
 */

router.get('/', authenticate, authorize('APRENDIZ'), documentosController.getDocumentosAprendiz);
router.get('/:id/descargar', authenticate, authorize('APRENDIZ'), documentosController.descargarDocumento);

module.exports = router;
