const { Router } = require('express');
const programaController = require('../controllers/programaController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const programaValidator = require('../validators/programaValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /programas:
 *   get:
 *     summary: Obtener todos los programas de formación
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de programas obtenida exitosamente
 */
router.get('/', programaController.getAll);

/**
 * @swagger
 * /programas/{id}:
 *   get:
 *     summary: Obtener un programa por ID
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Programa encontrado
 *       404:
 *         description: Programa no encontrado
 */
router.get('/:id', validate(programaValidator.idParam), programaController.getById);

/**
 * @swagger
 * /programas:
 *   post:
 *     summary: Crear un programa de formación
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, codigo, duracionMeses]
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               duracionMeses:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Programa creado exitosamente
 */
router.post('/', authorize('ADMIN'), validate(programaValidator.createPrograma), programaController.create);

/**
 * @swagger
 * /programas/{id}:
 *   put:
 *     summary: Actualizar un programa de formación
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               duracionMeses:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Programa actualizado
 */
router.put('/:id', authorize('ADMIN'), validate({ params: programaValidator.idParam, body: programaValidator.updatePrograma }), programaController.update);

/**
 * @swagger
 * /programas/{id}:
 *   delete:
 *     summary: Eliminar un programa de formación
 *     tags: [Programas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Programa eliminado
 */
router.delete('/:id', authorize('ADMIN'), validate(programaValidator.idParam), programaController.delete);

module.exports = router;
