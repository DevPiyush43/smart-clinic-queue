const Token = require('../models/Token');
const Clinic = require('../models/Clinic');
const QueueSession = require('../models/QueueSession');
const { getOrCreateSession, buildLivePayload } = require('../services/queueService');
const { sendToUser } = require('../services/fcmService');
const { isWithinWorkingHours, calcWaitTime, getTodayMidnight } = require('../utils/calcWaitTime');

const getIo = (req) => req.app.get('io');

// ─── POST /api/token/book ──────────────────────────────────────────────────
const bookToken = async (req, res) => {
  const { clinicId, notes } = req.body;

  if (!clinicId) {
    return res.status(400).json({ success: false, message: 'clinicId is required.' });
  }

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    return res.status(404).json({ success: false, message: 'Clinic not found.' });
  }

  if (!clinic.isAcceptingBookings) {
    return res.status(400).json({ success: false, message: 'This clinic is not accepting bookings right now.' });
  }

  if (!isWithinWorkingHours(clinic)) {
    return res.status(400).json({ success: false, message: 'Clinic is outside working hours.' });
  }

  const session = await getOrCreateSession(clinicId);

  if (!session.isAcceptingNew) {
    return res.status(400).json({ success: false, message: 'Booking is paused by the doctor.' });
  }

  if (session.queue.length >= clinic.maxQueueSize) {
    return res.status(400).json({ success: false, message: `Queue is full. Maximum ${clinic.maxQueueSize} patients allowed.` });
  }

  // Check if patient already has active token today
  const today = getTodayMidnight();
  const existingToken = await Token.findOne({
    patient: req.user._id,
    clinic: clinicId,
    status: { $in: ['waiting', 'next', 'serving'] },
    bookedAt: { $gte: today },
  });

  if (existingToken) {
    return res.status(409).json({
      success: false,
      message: 'You already have an active token for today.',
      token: existingToken,
    });
  }

  // Create token
  const tokenNumber = session.nextTokenNumber;
  const displayToken = `${clinic.tokenPrefix}${tokenNumber}`;
  const position = session.queue.length + 1;
  const estimatedWait = calcWaitTime(position, clinic.avgTimePerPatient);

  const qrData = JSON.stringify({
    displayToken,
    clinicName: clinic.name,
    date: new Date().toLocaleDateString('en-IN'),
    patientName: req.user.name,
  });

  const newToken = await Token.create({
    tokenNumber,
    displayToken,
    patient: req.user._id,
    clinic: clinicId,
    session: session._id,
    status: 'waiting',
    position,
    estimatedWait,
    notes: notes || '',
    qrData,
  });

  session.nextTokenNumber += 1;
  session.totalBooked += 1;
  session.queue.push(newToken._id);
  await session.save();

  // Socket: emit QUEUE_UPDATED
  const io = getIo(req);
  const updatedSession = await QueueSession.findById(session._id).populate({
    path: 'queue',
    populate: { path: 'patient', select: 'name' },
  });
  const payload = buildLivePayload(updatedSession, clinic, false);
  io.to(`clinic:${clinicId}`).emit('QUEUE_UPDATED', payload);

  // FCM: booking confirmation
  await sendToUser(
    req.user._id.toString(),
    '✅ Booking Confirmed!',
    `Your token is ${displayToken} at ${clinic.name}. Position: ${position}`,
    { tokenNumber: String(tokenNumber), clinicId },
    { type: 'booked', clinicId, tokenId: newToken._id }
  );

  return res.status(201).json({
    success: true,
    token: newToken,
    position,
    estimatedWait,
    currentToken: session.currentToken,
    sessionId: session._id,
  });
};

// ─── GET /api/token/my-active?clinicId=xxx ────────────────────────────────
const getMyActiveToken = async (req, res) => {
  const { clinicId } = req.query;
  const today = getTodayMidnight();

  const query = {
    patient: req.user._id,
    status: { $in: ['waiting', 'next', 'serving'] },
    bookedAt: { $gte: today },
  };
  if (clinicId) query.clinic = clinicId;

  const token = await Token.findOne(query)
    .populate('clinic', 'name doctorName city logoUrl avgTimePerPatient')
    .populate('session', 'currentToken currentTokenName');

  return res.json({ success: true, token: token || null });
};

// ─── GET /api/token/history?page=1&limit=10 ───────────────────────────────
const getTokenHistory = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const tokens = await Token.find({ patient: req.user._id })
    .sort({ bookedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('clinic', 'name doctorName city');

  const total = await Token.countDocuments({ patient: req.user._id });

  return res.json({
    success: true,
    tokens,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};

// ─── GET /api/token/:tokenId ──────────────────────────────────────────────
const getToken = async (req, res) => {
  const { tokenId } = req.params;

  const token = await Token.findById(tokenId)
    .populate('patient', 'name phone avatar')
    .populate('clinic', 'name doctorName city')
    .populate('session', 'currentToken currentTokenName doneCount');

  if (!token) {
    return res.status(404).json({ success: false, message: 'Token not found.' });
  }

  // If patient, only allow own token
  if (req.user.role === 'patient' && token.patient._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  return res.json({ success: true, token });
};

module.exports = { bookToken, getMyActiveToken, getTokenHistory, getToken };
