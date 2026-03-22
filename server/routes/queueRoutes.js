const express = require('express');
const router = express.Router();
const {
  getSessionToday,
  getSessionLive,
  callNext,
  skipPatient,
  completeToken,
  cancelToken,
  closeSession,
  toggleAccepting,
} = require('../controllers/queueController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// GET /api/queue/session/today
router.get('/session/today', optionalAuth, getSessionToday);

// GET /api/queue/session/live
router.get('/session/live', optionalAuth, getSessionLive);

// POST /api/queue/call-next (doctor only)
router.post('/call-next', protect, authorize('doctor'), callNext);

// POST /api/queue/skip (doctor only)
router.post('/skip', protect, authorize('doctor'), skipPatient);

// POST /api/queue/complete (doctor only)
router.post('/complete', protect, authorize('doctor'), completeToken);

// POST /api/queue/cancel (patient only — own token)
router.post('/cancel', protect, authorize('patient'), cancelToken);

// POST /api/queue/close-session (doctor only)
router.post('/close-session', protect, authorize('doctor'), closeSession);

// POST /api/queue/toggle-accepting (doctor only)
router.post('/toggle-accepting', protect, authorize('doctor'), toggleAccepting);

module.exports = router;
