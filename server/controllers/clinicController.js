const Clinic = require('../models/Clinic');
const multer = require('multer');
const path = require('path');

// Multer setup for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `clinic-${req.params.clinicId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP, GIF images allowed'));
    }
  },
});

// ─── GET /api/clinic/:clinicId ────────────────────────────────────────────
const getClinic = async (req, res) => {
  const clinic = await Clinic.findById(req.params.clinicId);
  if (!clinic) {
    return res.status(404).json({ success: false, message: 'Clinic not found.' });
  }
  return res.json({ success: true, clinic });
};

// ─── PUT /api/clinic/:clinicId ────────────────────────────────────────────
const updateClinic = async (req, res) => {
  // Doctor can only update their own clinic
  if (
    req.user.clinic?.toString() !== req.params.clinicId &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'You can only update your own clinic.' });
  }

  const allowedFields = [
    'name', 'doctorName', 'address', 'city', 'phone',
    'workingHours', 'workingDays', 'isOpen', 'isAcceptingBookings',
    'avgTimePerPatient', 'tokenPrefix', 'maxQueueSize', 'headUpCount',
    'smsSendEnabled', 'notifEnabled', 'queuePublic',
  ];

  const updateFields = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateFields[field] = req.body[field];
    }
  });

  const clinic = await Clinic.findByIdAndUpdate(
    req.params.clinicId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!clinic) {
    return res.status(404).json({ success: false, message: 'Clinic not found.' });
  }

  return res.json({ success: true, clinic });
};

// ─── POST /api/clinic/:clinicId/upload-logo ───────────────────────────────
const uploadLogoHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const logoUrl = `/uploads/${req.file.filename}`;

  const clinic = await Clinic.findByIdAndUpdate(
    req.params.clinicId,
    { logoUrl },
    { new: true }
  );

  if (!clinic) {
    return res.status(404).json({ success: false, message: 'Clinic not found.' });
  }

  return res.json({ success: true, logoUrl });
};

module.exports = { getClinic, updateClinic, upload, uploadLogoHandler };
