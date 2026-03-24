const express = require('express');
const { body, oneOf } = require('express-validator');
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

// POST /api/auth/send-otp  (accepts email OR phone)
router.post(
  '/send-otp',
  otpLimiter,
  [
    oneOf([
      body('email').trim().isEmail().withMessage('Valid email is required'),
      body('phone')
        .trim()
        .isLength({ min: 10, max: 10 })
        .withMessage('Phone must be exactly 10 digits')
        .isNumeric()
        .withMessage('Phone must contain only digits'),
    ], { message: 'Email or 10-digit phone number is required.' }),
  ],
  sendOtpHandler
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    oneOf([
      body('email').trim().isEmail(),
      body('phone').trim().isLength({ min: 10, max: 10 }).isNumeric(),
    ], { message: 'Email or phone is required.' }),
    body('otp').trim().isLength({ min: 4, max: 6 }).withMessage('OTP must be 4–6 digits'),
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
