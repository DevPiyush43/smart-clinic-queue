const QueueSession = require('../models/QueueSession');
const Token = require('../models/Token');
const { calcWaitTime, getTodayMidnight } = require('../utils/calcWaitTime');

/**
 * Get or create today's queue session for a clinic
 * @param {string} clinicId
 * @returns {QueueSession}
 */
const getOrCreateSession = async (clinicId) => {
  const today = getTodayMidnight();

  let session = await QueueSession.findOne({ clinic: clinicId, date: today });

  if (!session) {
    session = await QueueSession.create({
      clinic: clinicId,
      date: today,
      openedAt: new Date(),
    });
  }

  return session;
};

/**
 * Recalculate estimated wait times for all tokens in a session queue
 * @param {QueueSession} session - already populated with token objects
 * @param {number} avgTime - avg minutes per patient
 */
const recalcWaitTimes = async (session, avgTime = 5) => {
  const updates = session.queue.map((token, idx) => {
    const position = idx + 1;
    const wait = calcWaitTime(position, avgTime);
    return Token.findByIdAndUpdate(
      typeof token === 'object' ? token._id : token,
      { position, estimatedWait: wait }
    );
  });
  await Promise.all(updates);
};

/**
 * Build the live queue payload for socket emission / API response
 * @param {QueueSession} session - populated
 * @param {boolean} isDoctor - show full names if true
 */
const buildLivePayload = (session, clinic, isDoctor = false) => {
  const queue = (session.queue || []).map((token, idx) => {
    const t = typeof token === 'object' ? token : { tokenNumber: '?', displayToken: '?', patient: {} };
    const patientName = isDoctor
      ? (t.patient?.name || 'Unknown')
      : maskName(t.patient?.name || 'Unknown');

    return {
      _id: t._id,
      tokenNumber: t.tokenNumber,
      displayToken: t.displayToken || `#${t.tokenNumber}`,
      patientName,
      status: t.status,
      position: idx + 1,
      estimatedWait: calcWaitTime(idx + 1, clinic?.avgTimePerPatient || 5),
    };
  });

  return {
    clinicId: session.clinic,
    currentToken: session.currentToken,
    currentTokenName: session.currentTokenName,
    queueLength: session.queue.length,
    doneCount: session.doneCount,
    skippedCount: session.skippedCount,
    isAcceptingNew: session.isAcceptingNew,
    estimatedWait: calcWaitTime(session.queue.length, clinic?.avgTimePerPatient || 5),
    queue,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Mask patient name: "Rahul Deshmukh" → "Rahul D."
 */
const maskName = (name) => {
  if (!name) return 'Patient';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

module.exports = { getOrCreateSession, recalcWaitTimes, buildLivePayload, maskName };
