const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
    },
    doctorName: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
    },
    workingDays: {
      type: [String],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    isAcceptingBookings: {
      type: Boolean,
      default: true,
    },
    avgTimePerPatient: {
      type: Number,
      default: 5, // minutes
    },
    tokenPrefix: {
      type: String,
      default: '',
    },
    maxQueueSize: {
      type: Number,
      default: 100,
    },
    headUpCount: {
      type: Number,
      default: 2, // notify N patients before turn
    },
    smsSendEnabled: {
      type: Boolean,
      default: false,
    },
    notifEnabled: {
      type: Boolean,
      default: true,
    },
    queuePublic: {
      type: Boolean,
      default: true, // patients can see queue
    },
    totalPatientsServed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clinic', clinicSchema);
