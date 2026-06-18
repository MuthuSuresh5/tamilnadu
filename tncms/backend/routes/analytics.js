const express = require('express');
const router = express.Router();
const { getDashboardStats, getCategoryStats, getMonthlyTrend, getWardHeatmap, getPriorityStats, getCitizenStats, getPublicTeam } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// Public stats for landing page
router.get('/dashboard/public', getDashboardStats);
router.get('/team/public', getPublicTeam);

// Protected routes
router.get('/dashboard', protect, authorize('admin', 'officer'), getDashboardStats);
router.get('/category', protect, authorize('admin', 'officer'), getCategoryStats);
router.get('/monthly', protect, authorize('admin', 'officer'), getMonthlyTrend);
router.get('/heatmap', protect, authorize('admin', 'officer'), getWardHeatmap);
router.get('/priority', protect, authorize('admin', 'officer'), getPriorityStats);
router.get('/citizen', protect, getCitizenStats);

module.exports = router;
