const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// All dashboard routes are accessible by all roles (admin, analyst, viewer)
// All routes require a valid JWT token via the authenticate middleware

// GET /summary → Overall financial summary (income, expenses, net balance)
router.get(
    '/summary',
    authenticate,
    requireRole('admin', 'analyst', 'viewer'),
    dashboardController.getSummary
);

// GET /category-totals → Totals grouped by category and type
router.get(
    '/category-totals',
    authenticate,
    requireRole('admin', 'analyst', 'viewer'),
    dashboardController.getCategoryWiseTotals
);

// GET /monthly-trends → Monthly breakdown of income and expenses
// Optional query param: year (default current year)
router.get(
    '/monthly-trends',
    authenticate,
    requireRole('admin', 'analyst', 'viewer'),
    dashboardController.getMonthlyTrends
);

// GET /recent-activity → Most recent financial records with creator name
// Optional query param: limit (default 5, max 20)
router.get(
    '/recent-activity',
    authenticate,
    requireRole('admin', 'analyst', 'viewer'),
    dashboardController.getRecentActivity
);

// GET /weekly-trends → Weekly breakdown of income and expenses
// Optional query param: weeks (default 4, max 12)
router.get(
    '/weekly-trends',
    authenticate,
    requireRole('admin', 'analyst', 'viewer'),
    dashboardController.getWeeklyTrends
);

module.exports = router;
