const { Router } = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const userValidator = require('../validators/userValidator');

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPERADMIN'));
router.post('/users', validate({ body: userValidator.createUser }), userController.createByAdmin);

module.exports = router;