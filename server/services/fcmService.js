const { getAdmin, isFirebaseReady } = require('../config/firebase');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Send FCM push notification to a single user (all devices)
 * @param {string} userId - User _id (string)
 * @param {string} title
 * @param {string} body
 * @param {object} data - extra key-value data
 * @param {object} opts - { type, clinicId, tokenId } for logging
 */
const sendToUser = async (userId, title, body, data = {}, opts = {}) => {
  if (!isFirebaseReady()) {
    // Stub: log to console only
    console.log(`[FCM STUB] To user ${userId}: "${title}" — ${body}`);
    return;
  }

  try {
    const user = await User.findById(userId).select('fcmTokens notifEnabled');

    if (!user || !user.notifEnabled || !user.fcmTokens || user.fcmTokens.length === 0) {
      return;
    }

    const admin = getAdmin();
    const messaging = admin.messaging();

    const message = {
      tokens: user.fcmTokens,
      notification: { title, body },
      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'queue_alerts',
          sound: 'default',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    // Remove invalid tokens
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(user.fcmTokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: invalidTokens } },
      });
    }

    // Log notification
    await Notification.create({
      user: userId,
      clinic: opts.clinicId,
      token: opts.tokenId,
      type: opts.type || 'system',
      title,
      body,
      channel: 'fcm',
    });

    console.log(`[FCM] Sent to user ${userId}: ${response.successCount}/${user.fcmTokens.length} delivered`);
  } catch (err) {
    console.error('[FCM] Error sending notification:', err.message);
  }
};

/**
 * Send FCM push to all patients with active tokens in today's queue
 * @param {string} clinicId
 * @param {string} title
 * @param {string} body
 * @param {object} data
 */
const sendToClinic = async (clinicId, title, body, data = {}) => {
  const { getTodayMidnight } = require('../utils/calcWaitTime');
  const QueueSession = require('../models/QueueSession');
  const Token = require('../models/Token');

  try {
    const today = getTodayMidnight();
    const session = await QueueSession.findOne({ clinic: clinicId, date: today });
    if (!session) return;

    const tokens = await Token.find({
      session: session._id,
      status: { $in: ['waiting', 'next'] },
    }).select('patient');

    const patientIds = [...new Set(tokens.map((t) => t.patient.toString()))];

    await Promise.all(
      patientIds.map((patientId) => sendToUser(patientId, title, body, data, { clinicId }))
    );
  } catch (err) {
    console.error('[FCM] sendToClinic error:', err.message);
  }
};

module.exports = { sendToUser, sendToClinic };
