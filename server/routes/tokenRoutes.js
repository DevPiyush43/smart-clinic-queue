const express = require('express');
const router = express.Router();
const { bookToken, getMyActiveToken, getTokenHistory, getToken } = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// POST /api/token/book
router.post('/book', protect, authorize('patient'), bookToken);

// GET /api/token/my-active
router.get('/my-active', protect, authorize('patient'), getMyActiveToken);

// GET /api/token/history
router.get('/history', protect, getTokenHistory);

// GET /api/token/:tokenId
router.get('/:tokenId', protect, getToken);

module.exports = router;
