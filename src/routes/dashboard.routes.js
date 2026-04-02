const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/summary', authenticate, requireRole('admin', 'analyst', 'viewer'), dashboardController.getSummary);
router.get('/category-totals', authenticate, requireRole('admin', 'analyst', 'viewer'), dashboardController.getCategoryWiseTotals);
router.get('/monthly-trends', authenticate, requireRole('admin', 'analyst', 'viewer'), dashboardController.getMonthlyTrends);
router.get('/recent-activity', authenticate, requireRole('admin', 'analyst', 'viewer'), dashboardController.getRecentActivity);
router.get('/weekly-trends', authenticate, requireRole('admin', 'analyst', 'viewer'), dashboardController.getWeeklyTrends);

module.exports = router;
