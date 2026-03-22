const QueueSession = require('../models/QueueSession');
const Token = require('../models/Token');
const Clinic = require('../models/Clinic');
const { getOrCreateSession, recalcWaitTimes, buildLivePayload } = require('../services/queueService');
const { sendToUser } = require('../services/fcmService');
const { calcWaitTime } = require('../utils/calcWaitTime');

// Helper to get socket io instance
const getIo = (req) => req.app.get('io');

// ─── GET /api/queue/session/today?clinicId=xxx ────────────────────────────
const getSessionToday = async (req, res) => {
  const { clinicId } = req.query;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const session = await getOrCreateSession(clinicId);
  await QueueSession.populate(session, {
    path: 'queue',
    populate: { path: 'patient', select: 'name phone avatar' },
  });

  return res.json({ success: true, session });
};

// ─── GET /api/queue/session/live?clinicId=xxx ─────────────────────────────
const getSessionLive = async (req, res) => {
  const { clinicId } = req.query;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const session = await getOrCreateSession(clinicId);
  await QueueSession.populate(session, {
    path: 'queue',
    populate: { path: 'patient', select: 'name phone' },
  });

  const clinic = await Clinic.findById(clinicId);
  const isDoctor = req.user?.role === 'doctor';
  const payload = buildLivePayload(session, clinic, isDoctor);

  return res.json({ success: true, ...payload });
};

// ─── POST /api/queue/call-next ────────────────────────────────────────────
const callNext = async (req, res) => {
  const { clinicId } = req.body;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return res.status(404).json({ success: false, message: 'Clinic not found.' });

  const session = await getOrCreateSession(clinicId);
  await QueueSession.populate(session, {
    path: 'queue',
    populate: { path: 'patient', select: 'name phone fcmTokens notifEnabled' },
  });

  if (!session.queue || session.queue.length === 0) {
    return res.status(400).json({ success: false, message: 'Queue is empty. No patients to call.' });
  }

  // Mark previous serving token as done (if exists)
  if (session.currentToken > 0) {
    await Token.findOneAndUpdate(
      { session: session._id, tokenNumber: session.currentToken, status: 'serving' },
      { status: 'done', completedAt: new Date() }
    );
    session.doneCount += 1;
  }

  // Shift first token from queue
  const nextTokenId = session.queue[0]._id;
  session.queue.splice(0, 1);

  const nextToken = await Token.findById(nextTokenId).populate('patient', 'name _id fcmTokens notifEnabled');

  nextToken.status = 'serving';
  nextToken.calledAt = new Date();
  await nextToken.save();

  session.currentToken = nextToken.tokenNumber;
  session.currentTokenName = (nextToken.patient?.name || '').split(' ')[0];

  // Recalculate wait times
  await recalcWaitTimes(session, clinic.avgTimePerPatient);
  await session.save();

  // Emit QUEUE_UPDATED to clinic room
  const io = getIo(req);
  const updatedSession = await QueueSession.findById(session._id).populate({
    path: 'queue',
    populate: { path: 'patient', select: 'name' },
  });
  const payload = buildLivePayload(updatedSession, clinic, true);
  io.to(`clinic:${clinicId}`).emit('QUEUE_UPDATED', payload);

  // Emit PATIENT_CALLED to patient's room
  const patientId = nextToken.patient?._id?.toString();
  if (patientId) {
    io.to(`patient:${patientId}`).emit('PATIENT_CALLED', {
      tokenNumber: nextToken.tokenNumber,
      displayToken: nextToken.displayToken,
      clinicName: clinic.name,
      message: "🎉 It's your turn! Please go to the cabin now.",
    });

    // FCM push
    await sendToUser(
      patientId,
      '🎉 Your Turn!',
      `Head to ${clinic.doctorName}'s cabin now. Token #${nextToken.tokenNumber}`,
      { tokenNumber: String(nextToken.tokenNumber), clinicId },
      { type: 'your_turn', clinicId, tokenId: nextToken._id }
    );
  }

  // Check headUpCount -  find token that is exactly headUpCount positions away
  const headUpToken = updatedSession.queue[clinic.headUpCount - 1];
  if (headUpToken) {
    const populatedHeadUp = await Token.findById(
      typeof headUpToken === 'object' ? headUpToken._id : headUpToken
    ).populate('patient', '_id fcmTokens notifEnabled name');

    if (populatedHeadUp?.patient) {
      const hupPatientId = populatedHeadUp.patient._id.toString();
      const ahead = clinic.headUpCount;
      io.to(`patient:${hupPatientId}`).emit('HEADS_UP', {
        tokenNumber: populatedHeadUp.tokenNumber,
        ahead,
        message: `📡 Only ${ahead} patient(s) ahead. Get ready!`,
      });

      await sendToUser(
        hupPatientId,
        '📡 Get Ready!',
        `Only ${ahead} patient(s) ahead of you at ${clinic.name}.`,
        { tokenNumber: String(populatedHeadUp.tokenNumber), clinicId },
        { type: 'heads_up', clinicId, tokenId: populatedHeadUp._id }
      );
    }
  }

  return res.json({ success: true, session: payload, currentToken: nextToken });
};

// ─── POST /api/queue/skip ─────────────────────────────────────────────────
const skipPatient = async (req, res) => {
  const { clinicId, tokenId } = req.body;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const clinic = await Clinic.findById(clinicId);
  const session = await getOrCreateSession(clinicId);

  if (!session.queue || session.queue.length === 0) {
    return res.status(400).json({ success: false, message: 'Queue is empty.' });
  }

  let skipIndex = 0;
  if (tokenId) {
    skipIndex = session.queue.findIndex((t) => t.toString() === tokenId);
    if (skipIndex === -1) return res.status(404).json({ success: false, message: 'Token not found in queue.' });
  }

  // Move token to end
  const [skippedId] = session.queue.splice(skipIndex, 1);
  session.queue.push(skippedId);
  session.skippedCount += 1;

  await Token.findByIdAndUpdate(skippedId, { status: 'waiting' }); // reset to waiting
  await recalcWaitTimes(session, clinic?.avgTimePerPatient || 5);
  await session.save();

  const updatedSession = await QueueSession.findById(session._id).populate({
    path: 'queue',
    populate: { path: 'patient', select: 'name' },
  });

  const payload = buildLivePayload(updatedSession, clinic, true);
  const io = getIo(req);
  io.to(`clinic:${clinicId}`).emit('QUEUE_UPDATED', payload);

  return res.json({ success: true, session: payload });
};

// ─── POST /api/queue/complete ─────────────────────────────────────────────
const completeToken = async (req, res) => {
  const { clinicId, tokenId } = req.body;
  if (!clinicId || !tokenId) {
    return res.status(400).json({ success: false, message: 'clinicId and tokenId are required.' });
  }

  const clinic = await Clinic.findById(clinicId);
  const session = await getOrCreateSession(clinicId);

  const token = await Token.findById(tokenId);
  if (!token) return res.status(404).json({ success: false, message: 'Token not found.' });

  token.status = 'done';
  token.completedAt = new Date();
  await token.save();

  // Remove from queue if present
  session.queue = session.queue.filter((t) => t.toString() !== tokenId);
  session.doneCount += 1;
  await session.save();

  await Clinic.findByIdAndUpdate(clinicId, { $inc: { totalPatientsServed: 1 } });

  const updatedSession = await QueueSession.findById(session._id).populate({
    path: 'queue',
    populate: { path: 'patient', select: 'name' },
  });

  const payload = buildLivePayload(updatedSession, clinic, true);
  const io = getIo(req);
  io.to(`clinic:${clinicId}`).emit('QUEUE_UPDATED', payload);

  return res.json({ success: true, session: payload });
};

// ─── POST /api/queue/cancel ────────────────────────────────────────────────
const cancelToken = async (req, res) => {
  const { tokenId } = req.body;
  if (!tokenId) return res.status(400).json({ success: false, message: 'tokenId is required.' });

  const token = await Token.findById(tokenId).populate('session');
  if (!token) return res.status(404).json({ success: false, message: 'Token not found.' });

  // Verify ownership
  if (token.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only cancel your own token.' });
  }

  if (!['waiting', 'next'].includes(token.status)) {
    return res.status(400).json({ success: false, message: 'Cannot cancel a token that is already serving or done.' });
  }

  token.status = 'cancelled';
  token.cancelledAt = new Date();
  await token.save();

  const session = await QueueSession.findById(token.session);
  if (session) {
    session.queue = session.queue.filter((t) => t.toString() !== tokenId);
    session.cancelledCount += 1;
    await session.save();

    const clinic = await Clinic.findById(session.clinic);
    const updatedSession = await QueueSession.findById(session._id).populate({
      path: 'queue',
      populate: { path: 'patient', select: 'name' },
    });
    const payload = buildLivePayload(updatedSession, clinic, false);
    const io = getIo(req);
    io.to(`clinic:${session.clinic.toString()}`).emit('QUEUE_UPDATED', payload);
  }

  return res.json({ success: true, message: 'Token cancelled successfully.' });
};

// ─── POST /api/queue/close-session ────────────────────────────────────────
const closeSession = async (req, res) => {
  const { clinicId } = req.body;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const session = await getOrCreateSession(clinicId);

  // Cancel all waiting/next tokens
  await Token.updateMany(
    { session: session._id, status: { $in: ['waiting', 'next'] } },
    { status: 'cancelled', cancelledAt: new Date() }
  );

  session.isActive = false;
  session.isAcceptingNew = false;
  session.closedAt = new Date();
  session.queue = [];
  await session.save();

  const io = getIo(req);
  io.to(`clinic:${clinicId}`).emit('SESSION_CLOSED', {
    clinicId,
    message: 'Queue closed for today.',
  });

  return res.json({ success: true, message: "Today's queue has been closed." });
};

// ─── POST /api/queue/toggle-accepting ─────────────────────────────────────
const toggleAccepting = async (req, res) => {
  const { clinicId, isAcceptingNew } = req.body;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const session = await getOrCreateSession(clinicId);
  session.isAcceptingNew = Boolean(isAcceptingNew);
  await session.save();

  const clinic = await Clinic.findById(clinicId);
  const updatedSession = await QueueSession.findById(session._id).populate({
    path: 'queue',
    populate: { path: 'patient', select: 'name' },
  });

  const payload = buildLivePayload(updatedSession, clinic, true);
  const io = getIo(req);
  io.to(`clinic:${clinicId}`).emit('QUEUE_UPDATED', payload);

  if (!isAcceptingNew) {
    io.to(`clinic:${clinicId}`).emit('BOOKING_PAUSED', { clinicId, isAcceptingNew: false });
  }

  return res.json({ success: true, session: payload });
};

module.exports = {
  getSessionToday,
  getSessionLive,
  callNext,
  skipPatient,
  completeToken,
  cancelToken,
  closeSession,
  toggleAccepting,
};
