const { Router } = require('express');
const fichaController = require('../controllers/fichaController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const fichaValidator = require('../validators/fichaValidator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /fichas:
 *   get:
 *     summary: Obtener todas las fichas de formación
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fichas obtenida exitosamente
 */
router.get('/', fichaController.getAll);

/**
 * @swagger
 * /fichas/{id}:
 *   get:
 *     summary: Obtener una ficha por ID
 *     tags: [Fichas]
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
 *         description: Ficha obtenida
 *       404:
 *         description: Ficha no encontrada
 */
router.get('/:id', validate(fichaValidator.idParam), fichaController.getById);

/**
 * @swagger
 * /fichas:
 *   post:
 *     summary: Crear una ficha de formación
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero, jornada, fechaInicio, programaId]
 *             properties:
 *               numero:
 *                 type: string
 *               jornada:
 *                 type: string
 *                 enum: [MANANA, TARDE, NOCHE, MIXTA]
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *               fechaFin:
 *                 type: string
 *                 format: date
 *               programaId:
 *                 type: string
 *               instructorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ficha creada exitosamente
 */
router.post('/', authorize('ADMIN', 'INSTRUCTOR'), validate(fichaValidator.createFicha), fichaController.create);

/**
 * @swagger
 * /fichas/{id}:
 *   put:
 *     summary: Actualizar una ficha de formación
 *     tags: [Fichas]
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
 *               numero:
 *                 type: string
 *               jornada:
 *                 type: string
 *               fechaInicio:
 *                 type: string
 *               programaId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ficha actualizada
 */
router.put('/:id', authorize('ADMIN', 'INSTRUCTOR'), validate({ params: fichaValidator.idParam, body: fichaValidator.updateFicha }), fichaController.update);

/**
 * @swagger
 * /fichas/{id}:
 *   delete:
 *     summary: Eliminar una ficha de formación
 *     tags: [Fichas]
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
 *         description: Ficha eliminada
 */
router.delete('/:id', authorize('ADMIN'), validate(fichaValidator.idParam), fichaController.delete);

/**
 * @swagger
 * /fichas/{id}/aprendices:
 *   post:
 *     summary: Asignar un aprendiz a una ficha
 *     tags: [Fichas]
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
 *             required: [aprendizId]
 *             properties:
 *               aprendizId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Aprendiz asignado a la ficha
 */
router.post('/:id/aprendices', authorize('ADMIN', 'INSTRUCTOR'), validate({ params: fichaValidator.idParam, body: fichaValidator.addAprendiz }), fichaController.addAprendiz);

/**
 * @swagger
 * /fichas/{id}/aprendices/{aprendizId}:
 *   delete:
 *     summary: Remover un aprendiz de una ficha
 *     tags: [Fichas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: aprendizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aprendiz removido de la ficha
 */
router.delete('/:id/aprendices/:aprendizId', authorize('ADMIN'), validate(fichaValidator.aprendizIdParam), fichaController.removeAprendiz);

module.exports = router;
