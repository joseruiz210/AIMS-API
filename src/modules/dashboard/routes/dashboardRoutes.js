const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../../../middlewares/auth');

const router = Router();

router.use(authenticate, authorize('APRENDIZ', 'ADMIN'));
router.get('/dashboard', dashboardController.getLearnerDashboard);

module.exports = router;