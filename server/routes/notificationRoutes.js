const express = require('express');
const router = express.Router();
const { getMyNotifications, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/notifications/my
router.get('/my', protect, getMyNotifications);

// PUT /api/notifications/read-all
router.put('/read-all', protect, markAllRead);

module.exports = router;
