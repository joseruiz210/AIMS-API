const { Router } = require('express');
const moduloController = require('../controllers/moduloController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const moduloValidator = require('../validators/moduloValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /modulos:
 *   get:
 *     summary: Obtener todos los módulos de formación
 *     tags: [Módulos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programaId
 *         schema:
 *           type: string
 *         description: Filtrar por ID del programa
 *     responses:
 *       200:
 *         description: Lista de módulos obtenida exitosamente
 */
router.get('/', validate(moduloValidator.queryModulo), moduloController.getAll);

/**
 * @swagger
 * /modulos/{id}:
 *   get:
 *     summary: Obtener un módulo por ID
 *     tags: [Módulos]
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
 *         description: Módulo obtenido
 *       404:
 *         description: Módulo no encontrado
 */
router.get('/:id', validate(moduloValidator.idParam), moduloController.getById);

/**
 * @swagger
 * /modulos:
 *   post:
 *     summary: Crear un nuevo módulo de formación
 *     tags: [Módulos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, horasFormacion, programaId]
 *             properties:
 *               nombre:
 *                 type: string
 *               horasFormacion:
 *                 type: integer
 *               programaId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Módulo creado exitosamente
 */
router.post('/', authorize('ADMIN', 'INSTRUCTOR'), validate(moduloValidator.createModulo), moduloController.create);

/**
 * @swagger
 * /modulos/{id}:
 *   put:
 *     summary: Actualizar un módulo existente
 *     tags: [Módulos]
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
 *               horasFormacion:
 *                 type: integer
 *               programaId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Módulo actualizado
 */
router.put('/:id', authorize('ADMIN', 'INSTRUCTOR'), validate({ params: moduloValidator.idParam, body: moduloValidator.updateModulo }), moduloController.update);

/**
 * @swagger
 * /modulos/{id}:
 *   delete:
 *     summary: Eliminar un módulo por ID
 *     tags: [Módulos]
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
 *         description: Módulo eliminado
 */
router.delete('/:id', authorize('ADMIN'), validate(moduloValidator.idParam), moduloController.delete);

module.exports = router;
