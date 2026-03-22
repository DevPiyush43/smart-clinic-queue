const express = require('express');
const router = express.Router();
const { getSummary, getDaily, getHourly } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// GET /api/analytics/summary
router.get('/summary', protect, authorize('doctor', 'admin'), getSummary);

// GET /api/analytics/daily
router.get('/daily', protect, authorize('doctor', 'admin'), getDaily);

// GET /api/analytics/hourly
router.get('/hourly', protect, authorize('doctor', 'admin'), getHourly);

module.exports = router;
