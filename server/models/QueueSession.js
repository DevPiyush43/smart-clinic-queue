const mongoose = require('mongoose');

const queueSessionSchema = new mongoose.Schema(
  {
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    date: {
      type: Date, // midnight of the day
      required: true,
    },
    currentToken: {
      type: Number,
      default: 0,
    },
    currentTokenName: {
      type: String,
      default: '',
    },
    nextTokenNumber: {
      type: Number,
      default: 1,
    },
    queue: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Token',
      },
    ],
    doneCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    cancelledCount: {
      type: Number,
      default: 0,
    },
    totalBooked: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isAcceptingNew: {
      type: Boolean,
      default: true,
    },
    openedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Unique index: one session per clinic per day
queueSessionSchema.index({ clinic: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('QueueSession', queueSessionSchema);
