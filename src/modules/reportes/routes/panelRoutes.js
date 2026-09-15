const { Router } = require('express');
const panelController = require('../controllers/panelController');
const { authenticate, authorize } = require('../../../middlewares/auth');

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/stats', panelController.getStats);
router.get('/recent-activity', panelController.getRecentActivity);

module.exports = router;