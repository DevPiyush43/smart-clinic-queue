const cron = require('node-cron');
const QueueSession = require('../models/QueueSession');
const Token = require('../models/Token');
const { sendToClinic } = require('../services/fcmService');

/**
 * Midnight cron job — resets all active sessions from previous days
 * Runs at 00:00 every day
 */
const startResetCron = (io) => {
  cron.schedule('0 0 * * *', async () => {
    console.log('\n⏰ [CRON] Running midnight queue reset...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all sessions from before today that are still active
      const staleSessions = await QueueSession.find({
        date: { $lt: today },
        isActive: true,
      }).populate('clinic', 'name');

      if (staleSessions.length === 0) {
        console.log('[CRON] No stale sessions to reset.');
        return;
      }

      for (const session of staleSessions) {
        const clinicId = session.clinic._id.toString();
        const clinicName = session.clinic.name;

        // Cancel all remaining tokens
        await Token.updateMany(
          { session: session._id, status: { $in: ['waiting', 'next'] } },
          { status: 'cancelled', cancelledAt: new Date() }
        );

        // Close session
        session.isActive = false;
        session.isAcceptingNew = false;
        session.closedAt = new Date();
        session.queue = [];
        await session.save();

        // Socket notification
        if (io) {
          io.to(`clinic:${clinicId}`).emit('SESSION_CLOSED', {
            clinicId,
            message: 'Queue closed for today.',
          });
        }

        // FCM to affected patients
        await sendToClinic(
          clinicId,
          'ℹ️ Queue Closed',
          `Today's queue at ${clinicName} has been closed. Book again tomorrow.`,
          { clinicId }
        );

        console.log(`[CRON] Reset session for clinic: ${clinicName} (${clinicId})`);
      }

      console.log(`[CRON] Auto-reset: ${staleSessions.length} session(s) closed\n`);
    } catch (err) {
      console.error('[CRON] Error during midnight reset:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  console.log('⏰ Midnight queue reset cron scheduled (Asia/Kolkata timezone)');
};

module.exports = { startResetCron };
