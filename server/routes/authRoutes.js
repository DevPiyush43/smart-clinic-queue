const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  sendOtpHandler,
  verifyOtpHandler,
  doctorLogin,
  updateProfile,
  registerFcm,
  registerWebPush,
  logout,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { otpLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  otpLimiter,
  [
    body('phone')
      .trim()
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone must be exactly 10 digits')
      .isNumeric()
      .withMessage('Phone must contain only digits'),
  ],
  sendOtpHandler
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('phone').trim().isLength({ min: 10, max: 10 }).withMessage('Invalid phone'),
    body('otp').trim().isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits'),
  ],
  verifyOtpHandler
);

// POST /api/auth/doctor-login
router.post('/doctor-login', doctorLogin);

// PUT /api/auth/profile (protected)
router.put('/profile', protect, updateProfile);

// POST /api/auth/register-fcm (protected)
router.post('/register-fcm', protect, registerFcm);

// POST /api/auth/register-web-push (protected)
router.post('/register-web-push', protect, registerWebPush);

// POST /api/auth/logout (protected)
router.post('/logout', protect, logout);

module.exports = router;
