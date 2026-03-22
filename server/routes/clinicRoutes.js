const express = require('express');
const router = express.Router();
const { getClinic, updateClinic, upload, uploadLogoHandler } = require('../controllers/clinicController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// GET /api/clinic/:clinicId (public)
router.get('/:clinicId', optionalAuth, getClinic);

// PUT /api/clinic/:clinicId (doctor only)
router.put('/:clinicId', protect, authorize('doctor', 'admin'), updateClinic);

// POST /api/clinic/:clinicId/upload-logo (doctor only)
router.post(
  '/:clinicId/upload-logo',
  protect,
  authorize('doctor', 'admin'),
  upload.single('logo'),
  uploadLogoHandler
);

module.exports = router;
