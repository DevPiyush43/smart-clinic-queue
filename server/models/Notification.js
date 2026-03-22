const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
    },
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
    },
    type: {
      type: String,
      enum: ['heads_up', 'your_turn', 'booked', 'cancelled', 'system'],
      required: true,
    },
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    channel: {
      type: String,
      enum: ['socket', 'fcm', 'sms', 'web_push'],
      default: 'socket',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
