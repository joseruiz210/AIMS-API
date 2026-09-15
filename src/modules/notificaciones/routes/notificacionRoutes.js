const { Router } = require('express');
const notificacionController = require('../controllers/notificacionController');
const { authenticate } = require('../../../middlewares/auth');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     summary: Obtener las notificaciones del usuario autenticado
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones obtenida exitosamente
 */
router.get('/', notificacionController.getMisNotificaciones);

/**
 * @swagger
 * /notificaciones/{id}/read:
 *   patch:
 *     summary: Marcar una notificación como leída
 *     tags: [Notificaciones]
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
 *         description: Notificación marcada como leída
 */
router.patch('/:id/read', notificacionController.markAsRead);

/**
 * @swagger
 * /notificaciones/read-all:
 *   patch:
 *     summary: Marcar todas las notificaciones del usuario como leídas
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las notificaciones fueron marcadas como leídas
 */
router.patch('/read-all', notificacionController.markAllAsRead);

module.exports = router;
