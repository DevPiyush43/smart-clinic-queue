const QueueSession = require('../models/QueueSession');
const Token = require('../models/Token');
const Clinic = require('../models/Clinic');
const { getTodayMidnight } = require('../utils/calcWaitTime');

// ─── GET /api/analytics/summary?clinicId=xxx ──────────────────────────────
const getSummary = async (req, res) => {
  const { clinicId } = req.query;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return res.status(404).json({ success: false, message: 'Clinic not found.' });

  const today = getTodayMidnight();
  const session = await QueueSession.findOne({ clinic: clinicId, date: today });

  const todayStats = session
    ? {
        currentToken: session.currentToken,
        remaining: session.queue.length,
        done: session.doneCount,
        skipped: session.skippedCount,
        cancelled: session.cancelledCount,
        totalBooked: session.totalBooked,
        isAccepting: session.isAcceptingNew,
      }
    : {
        currentToken: 0,
        remaining: 0,
        done: 0,
        skipped: 0,
        cancelled: 0,
        totalBooked: 0,
        isAccepting: true,
      };

  // Weekly stats (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklySessions = await QueueSession.find({
    clinic: clinicId,
    date: { $gte: weekAgo },
  });

  const totalPatients = weeklySessions.reduce((s, sess) => s + sess.totalBooked, 0);
  const avgPerDay = weeklySessions.length > 0 ? Math.round(totalPatients / weeklySessions.length) : 0;
  const skippedTotal = weeklySessions.reduce((s, sess) => s + sess.skippedCount, 0);
  const skipRate = totalPatients > 0 ? Math.round((skippedTotal / totalPatients) * 100) : 0;

  return res.json({
    success: true,
    today: todayStats,
    weekly: {
      totalPatients,
      avgPerDay,
      avgWaitTime: clinic.avgTimePerPatient,
      skipRate,
    },
    allTime: {
      totalServed: clinic.totalPatientsServed,
    },
    rating: 4.8, // stub rating
  });
};

// ─── GET /api/analytics/daily?clinicId=xxx&days=7 ─────────────────────────
const getDaily = async (req, res) => {
  const { clinicId } = req.query;
  const days = parseInt(req.query.days) || 7;

  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const session = await QueueSession.findOne({ clinic: clinicId, date });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const label = i === 0 ? 'Today' : dayNames[date.getDay()];

    results.push({
      date: date.toISOString(),
      label,
      totalBooked: session?.totalBooked || 0,
      doneCount: session?.doneCount || 0,
      skippedCount: session?.skippedCount || 0,
      cancelledCount: session?.cancelledCount || 0,
      avgWait: 5, // stub based on clinic avgTimePerPatient
    });
  }

  return res.json({ success: true, data: results });
};

// ─── GET /api/analytics/hourly?clinicId=xxx&date=YYYY-MM-DD ───────────────
const getHourly = async (req, res) => {
  const { clinicId, date } = req.query;
  if (!clinicId) return res.status(400).json({ success: false, message: 'clinicId is required.' });

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const tokens = await Token.find({
    clinic: clinicId,
    bookedAt: { $gte: targetDate, $lt: nextDay },
  }).select('bookedAt');

  // Aggregate by hour
  const hourMap = {};
  for (let h = 8; h <= 18; h++) {
    hourMap[`${h.toString().padStart(2, '0')}:00`] = 0;
  }

  tokens.forEach((t) => {
    const h = new Date(t.bookedAt).getHours();
    const key = `${h.toString().padStart(2, '0')}:00`;
    if (hourMap[key] !== undefined) {
      hourMap[key] += 1;
    }
  });

  const data = Object.entries(hourMap).map(([hour, count]) => ({ hour, count }));

  return res.json({ success: true, data });
};

module.exports = { getSummary, getDaily, getHourly };
