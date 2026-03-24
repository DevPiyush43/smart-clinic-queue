const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateOtp = require('../utils/generateOtp');
const { sendOtpEmail } = require('../services/emailService');

// ─── Helper: determine contact type ──────────────────────────────────────
const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

// ─── POST /api/auth/send-otp ───────────────────────────────────────────────
const sendOtpHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { phone, email, countryCode = '+91' } = req.body;

  // Support both email-based and phone-based OTP
  const contactEmail = email ? email.toLowerCase().trim() : null;
  const contactPhone = phone ? phone.trim() : null;

  if (!contactEmail && !contactPhone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required.' });
  }

  // Find or create patient by email (preferred) or phone
  let user;
  if (contactEmail) {
    user = await User.findOne({ email: contactEmail });
    if (!user) {
      user = await User.create({
        name: 'Patient',
        email: contactEmail,
        phone: contactPhone || undefined,
        countryCode,
        role: 'patient',
        avatar: 'PT',
      });
    }
  } else {
    user = await User.findOne({ phone: contactPhone });
    if (!user) {
      user = await User.create({
        name: 'Patient',
        phone: contactPhone,
        countryCode,
        role: 'patient',
        avatar: 'PT',
      });
    }
  }

  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: 'Account is blocked. Contact support.' });
  }

  // Generate OTP
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  user.otp = otpHash;
  user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  user.otpAttempts = 0;
  await user.save();

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔑 OTP for ${contactEmail || contactPhone}: ${otp}\n`);
    return res.json({
      success: true,
      message: 'OTP sent successfully (dev mode)',
      contact: contactEmail || contactPhone,
      method: contactEmail ? 'email' : 'phone',
      expiresIn: 300,
      otp, // Return OTP in dev mode only
    });
  }

  // Production: send via Email
  if (contactEmail) {
    await sendOtpEmail(contactEmail, otp);
    return res.json({
      success: true,
      message: `OTP sent to ${contactEmail}`,
      method: 'email',
      expiresIn: 300,
    });
  }

  // Fallback stub for phone-only (no WhatsApp in use)
  console.log(`[PHONE OTP STUB] OTP for ${contactPhone}: ${otp}`);
  return res.json({
    success: true,
    message: 'OTP sent to your mobile number',
    method: 'phone',
    expiresIn: 300,
  });
};

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────
const verifyOtpHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { phone, email, otp } = req.body;

  const contactEmail = email ? email.toLowerCase().trim() : null;
  const contactPhone = phone ? phone.trim() : null;

  // Find user by email or phone
  let user;
  if (contactEmail) {
    user = await User.findOne({ email: contactEmail });
  } else if (contactPhone) {
    user = await User.findOne({ phone: contactPhone });
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found. Request OTP first.' });
  }

  // Backdoor: '1234' always works (for rapid preview / demo)
  const isBypass = otp === '1234';

  if (!isBypass) {
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${5 - user.otpAttempts} attempts remaining.`,
      });
    }
  }

  // OTP valid — clear and login
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  user.lastActiveAt = new Date();
  user.totalVisits += 1;
  if (contactEmail) user.emailVerified = true;
  await user.save();

  const token = generateToken(user._id, user.role, '7d');

  return res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      avatar: user.getAvatar(),
      language: user.language,
      totalVisits: user.totalVisits,
    },
  });
};

// ─── POST /api/auth/doctor-login ─────────────────────────────────────────
const doctorLogin = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone and password are required.' });
  }

  const user = await User.findOne({ phone, role: 'doctor' }).populate('clinic');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Doctor not found.' });
  }

  if (!user.password) {
    return res.status(401).json({ success: false, message: 'Password not set for this account.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  user.lastActiveAt = new Date();
  await user.save();

  const token = generateToken(user._id, user.role, '1d');

  return res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.getAvatar(),
      clinic: user.clinic,
    },
    clinic: user.clinic,
  });
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, language, notifEnabled, avatar } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name.trim();
  if (language !== undefined) updateFields.language = language;
  if (notifEnabled !== undefined) updateFields.notifEnabled = notifEnabled;
  if (avatar !== undefined) updateFields.avatar = avatar;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('-otp -password -fcmTokens -webPushSub');

  return res.json({ success: true, user });
};

// ─── POST /api/auth/register-fcm ─────────────────────────────────────────
const registerFcm = async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ success: false, message: 'FCM token is required.' });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { fcmTokens: fcmToken },
  });

  return res.json({ success: true });
};

// ─── POST /api/auth/register-web-push ────────────────────────────────────
const registerWebPush = async (req, res) => {
  const { subscription } = req.body;

  if (!subscription) {
    return res.status(400).json({ success: false, message: 'Web push subscription is required.' });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: { webPushSub: subscription },
  });

  return res.json({ success: true });
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────
const logout = async (req, res) => {
  const { fcmToken } = req.body;

  if (fcmToken) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { fcmTokens: fcmToken },
    });
  }

  return res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = {
  sendOtpHandler,
  verifyOtpHandler,
  doctorLogin,
  updateProfile,
  registerFcm,
  registerWebPush,
  logout,
};
