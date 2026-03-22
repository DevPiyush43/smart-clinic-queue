const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },
    displayToken: {
      type: String, // prefix + number, e.g. 'A25' or '#25'
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueSession',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'next', 'serving', 'done', 'skipped', 'cancelled'],
      default: 'waiting',
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    estimatedWait: {
      type: Number, // minutes
      default: 0,
    },
    position: {
      type: Number, // 1-based, live
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
    qrData: {
      type: String, // JSON encoded for QR code
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup
tokenSchema.index({ patient: 1, session: 1 });
tokenSchema.index({ clinic: 1, status: 1 });

module.exports = mongoose.model('Token', tokenSchema);
