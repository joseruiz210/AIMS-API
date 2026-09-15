const { Router } = require('express');
const asistenciaController = require('../controllers/asistenciaController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const asistenciaValidator = require('../validators/asistenciaValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /asistencia/mis-asistencias:
 *   get:
 *     summary: Obtener reporte de asistencias del aprendiz autenticado
 *     tags: [Asistencia]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reporte de asistencias obtenido
 */
router.get('/mis-asistencias', asistenciaController.getMisAsistencias);

/**
 * @swagger
 * /asistencia/registrar:
 *   post:
 *     summary: Registrar asistencias masivas para una sesión de formación
 *     tags: [Asistencia]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registros]
 *             properties:
 *               registros:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [fichaAprendizId, horarioId, fecha, estado]
 *                   properties:
 *                     fichaAprendizId:
 *                       type: string
 *                     horarioId:
 *                       type: string
 *                     fecha:
 *                       type: string
 *                       format: date
 *                     estado:
 *                       type: string
 *                       enum: [PRESENTE, AUSENTE, TARDANZA, EXCUSA]
 *                     observacion:
 *                       type: string
 *     responses:
 *       201:
 *         description: Asistencias registradas exitosamente
 */
router.get('/ficha/:fichaId', authorize('INSTRUCTOR', 'ADMIN'), asistenciaController.getAsistenciasByFicha);
router.post('/registrar', authorize('INSTRUCTOR', 'ADMIN'), validate(asistenciaValidator.registrarAsistencia), asistenciaController.registrarAsistencia);

module.exports = router;
