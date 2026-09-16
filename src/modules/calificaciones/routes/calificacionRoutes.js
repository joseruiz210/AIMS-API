const { Router } = require('express');
const calificacionController = require('../controllers/calificacionController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const calificacionValidator = require('../validators/calificacionValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /calificaciones/mis-calificaciones:
 *   get:
 *     summary: Obtener el boletín de calificaciones del aprendiz autenticado
 *     tags: [Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calificaciones obtenidas exitosamente
 */
router.get('/mis-calificaciones', authorize('APRENDIZ'), calificacionController.getMisCalificaciones);
router.get('/ficha/:fichaId', authorize('INSTRUCTOR', 'ADMIN', 'SUPERADMIN'), calificacionController.getCalificacionesByFicha);

/**
 * @swagger
 * /calificaciones:
 *   post:
 *     summary: Registrar o actualizar una calificación
 *     tags: [Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [aprendizId, fichaId, moduloId, nota]
 *             properties:
 *               aprendizId:
 *                 type: string
 *               fichaId:
 *                 type: string
 *               moduloId:
 *                 type: string
 *               nota:
 *                 type: number
 *                 example: 4.5
 *               periodo:
 *                 type: string
 *                 example: "2026-1"
 *     responses:
 *       200:
 *         description: Calificación registrada exitosamente
 */
router.post('/', authorize('INSTRUCTOR', 'ADMIN', 'SUPERADMIN'), validate(calificacionValidator.registrarCalificacion), calificacionController.registrarCalificacion);

module.exports = router;
