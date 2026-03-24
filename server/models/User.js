const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,  // allow null for email-only accounts
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,  // allow null; unique when set
      unique: true,
      trim: true,
      lowercase: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    countryCode: {
      type: String,
      default: '+91',
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    password: {
      type: String, // doctors only, bcrypt hashed
    },
    otp: {
      type: String, // hashed, temporary
    },
    otpExpiry: {
      type: Date,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic', // doctor only
    },
    avatar: {
      type: String, // initials e.g. 'RD' or image URL
    },
    totalVisits: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      enum: ['en', 'mr', 'hi'],
      default: 'en',
    },
    notifEnabled: {
      type: Boolean,
      default: true,
    },
    fcmTokens: {
      type: [String], // array — multiple devices per patient
      default: [],
    },
    webPushSub: {
      type: mongoose.Schema.Types.Mixed, // Web Push subscription JSON
    },
    lastActiveAt: {
      type: Date,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Helper: generate avatar initials from name
userSchema.methods.getAvatar = function () {
  if (this.avatar) return this.avatar;
  const parts = (this.name || '').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || '?').substring(0, 2).toUpperCase();
};

module.exports = mongoose.model('User', userSchema);
