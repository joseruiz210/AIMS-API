const { Router } = require('express');
const horarioController = require('../controllers/horarioController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const horarioValidator = require('../validators/horarioValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /horarios/mi-horario:
 *   get:
 *     summary: Obtener el horario del aprendiz autenticado
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Horario obtenido exitosamente
 */
router.get('/mi-horario', horarioController.getMiHorario);

/**
 * @swagger
 * /horarios:
 *   post:
 *     summary: Crear un bloque de horario para una ficha
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fichaId, diaSemana, horaInicio, horaFin]
 *             properties:
 *               fichaId:
 *                 type: string
 *               diaSemana:
 *                 type: integer
 *                 description: 1=Lunes, 7=Domingo
 *               horaInicio:
 *                 type: string
 *                 example: "07:00"
 *               horaFin:
 *                 type: string
 *                 example: "12:00"
 *               ambiente:
 *                 type: string
 *               tema:
 *                 type: string
 *     responses:
 *       201:
 *         description: Horario creado exitosamente
 */
router.post('/', authorize('ADMIN', 'INSTRUCTOR'), validate(horarioValidator.createHorario), horarioController.create);

module.exports = router;
