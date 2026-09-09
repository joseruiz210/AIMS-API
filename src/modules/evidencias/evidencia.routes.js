const { Router } = require('express');
const evidenciaController = require('./evidencia.controller');
const { authenticate, authorize } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const evidenciaValidator = require('./evidencia.validator');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /evidencias:
 *   get:
 *     summary: Obtener lista de evidencias académicas
 *     tags: [Evidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fichaId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de la ficha
 *     responses:
 *       200:
 *         description: Lista de evidencias obtenida
 */
router.get('/', evidenciaController.getAll);

/**
 * @swagger
 * /evidencias/{id}:
 *   get:
 *     summary: Obtener detalle de una evidencia
 *     tags: [Evidencias]
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
 *         description: Detalle de evidencia
 */
router.get('/:id', validate(evidenciaValidator.idParam), evidenciaController.getById);

/**
 * @swagger
 * /evidencias:
 *   post:
 *     summary: Crear una nueva evidencia (instructores)
 *     tags: [Evidencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, descripcion, fechaLimite, fichaId]
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fechaLimite:
 *                 type: string
 *                 format: date-time
 *               fichaId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Evidencia creada exitosamente
 */
router.post('/', authorize('INSTRUCTOR', 'ADMIN'), validate(evidenciaValidator.createEvidencia), evidenciaController.create);

/**
 * @swagger
 * /evidencias/generar-propuesta-ia:
 *   post:
 *     summary: Generar propuesta y redacción de actividad formativa
 *     tags: [Evidencias]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generar-propuesta-ia', authorize('INSTRUCTOR', 'ADMIN'), evidenciaController.generarPropuestaIa);

/**
 * @swagger
 * /evidencias/{id}:
 *   put:
 *     summary: Actualizar una evidencia existente
 *     tags: [Evidencias]
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
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fechaLimite:
 *                 type: string
 *                 format: date-time
 *               fichaId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evidencia actualizada
 */
router.put('/:id', authorize('INSTRUCTOR', 'ADMIN'), validate({ params: evidenciaValidator.idParam, body: evidenciaValidator.updateEvidencia }), evidenciaController.update);

/**
 * @swagger
 * /evidencias/{id}:
 *   delete:
 *     summary: Eliminar una evidencia
 *     tags: [Evidencias]
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
 *         description: Evidencia eliminada
 */
router.delete('/:id', authorize('INSTRUCTOR', 'ADMIN'), validate(evidenciaValidator.idParam), evidenciaController.delete);

/**
 * @swagger
 * /evidencias/{id}/entregas:
 *   post:
 *     summary: Subir una entrega de evidencia (aprendiz)
 *     tags: [Evidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               archivoUrl:
 *                 type: string
 *               comentario:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entrega enviada exitosamente
 */
router.post('/:id/entregas', authorize('APRENDIZ', 'ADMIN'), validate({ params: evidenciaValidator.idParam, body: evidenciaValidator.entregarEvidencia }), evidenciaController.entregar);

/**
 * @swagger
 * /evidencias/{id}/entregas:
 *   get:
 *     summary: Obtener las entregas registradas para una evidencia
 *     tags: [Evidencias]
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
 *         description: Lista de entregas obtenida
 */
router.get('/:id/entregas', authorize('INSTRUCTOR', 'ADMIN'), validate(evidenciaValidator.idParam), evidenciaController.getEntregas);

/**
 * @swagger
 * /evidencias/{id}/entregas/{entregaId}/calificar:
 *   put:
 *     summary: Calificar una entrega de evidencia (instructor)
 *     tags: [Evidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entregaId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nota]
 *             properties:
 *               nota:
 *                 type: number
 *                 example: 4.5
 *     responses:
 *       200:
 *         description: Entrega calificada exitosamente
 */
router.put('/:id/entregas/:entregaId/calificar', authorize('INSTRUCTOR', 'ADMIN'), validate({ params: evidenciaValidator.entregaIdParam, body: evidenciaValidator.calificarEntrega }), evidenciaController.calificarEntrega);

module.exports = router;
