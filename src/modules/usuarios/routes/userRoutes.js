const { Router } = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const userValidator = require('../validators/userValidator');

const router = Router();

// ─── Profile Routes (Authenticated User) ───────────────────────────

/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Actualizar perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       401:
 *         description: No autorizado
 */
router.put(
  '/profile',
  authenticate,
  validate({ body: userValidator.updateUser }),
  userController.updateProfile
);

/**
 * @swagger
 * /users/push-token:
 *   post:
 *     tags: [Users]
 *     summary: Actualizar Expo Push Token para notificaciones móviles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pushToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token actualizado exitosamente
 */
router.post('/push-token', authenticate, userController.updatePushToken);
router.put('/push-token', authenticate, userController.updatePushToken);

// ─── Admin Routes ────────────────────────────────────────────────

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Listar todos los usuarios (solo ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, INSTRUCTOR, APRENDIZ]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, email, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de usuarios con paginación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (Requiere ADMIN)
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate({ query: userValidator.queryUsers }),
  userController.getAll
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  userController.create
);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Crear un nuevo usuario directamente (solo ADMIN)
 *     security:
 *       - bearerAuth: []
 */
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtener un usuario por ID (solo ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *       400:
 *         description: ID inválido (debe ser UUID)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (Requiere ADMIN)
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate({ params: userValidator.id }),
  userController.getById
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Actualizar un usuario (solo ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, INSTRUCTOR, APRENDIZ]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: ID inválido o datos incorrectos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (Requiere ADMIN)
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Email ya en uso
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate({ params: userValidator.id, body: userValidator.updateUser }),
  userController.update
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar un usuario (solo ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (Requiere ADMIN)
 *       404:
 *         description: Usuario no encontrado
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate({ params: userValidator.id }),
  userController.delete
);

/**
 * @swagger
 * /users/{id}/toggle-active:
 *   patch:
 *     tags: [Users]
 *     summary: Activar/Desactivar un usuario (solo ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (Requiere ADMIN)
 *       404:
 *         description: Usuario no encontrado
 */
router.patch(
  '/:id/toggle-active',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate({ params: userValidator.id }),
  userController.toggleActive
);

module.exports = router;
