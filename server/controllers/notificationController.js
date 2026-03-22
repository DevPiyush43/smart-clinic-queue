const Notification = require('../models/Notification');

// ─── GET /api/notifications/my?page=1&limit=20 ────────────────────────────
const getMyNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ user: req.user._id })
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('clinic', 'name')
    .populate('token', 'displayToken tokenNumber');

  const total = await Notification.countDocuments({ user: req.user._id });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  return res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};

// ─── PUT /api/notifications/read-all ─────────────────────────────────────
const markAllRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  return res.json({ success: true, message: 'All notifications marked as read.' });
};

module.exports = { getMyNotifications, markAllRead };
