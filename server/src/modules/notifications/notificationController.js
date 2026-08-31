import Notification from '../../models/Notification.js';
import User from '../../models/User.js';

// @desc    Get current user's notifications
// @route   GET /api/v1/notifications or /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.user._id, read: false });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   POST /api/v1/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin broadcast notification
// @route   POST /api/v1/admin/notifications/broadcast
// @access  Private (SUPER_ADMIN)
export const broadcastNotification = async (req, res) => {
  try {
    const { title, message, role, channel = 'IN_APP' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const query = role ? { role } : {};
    const users = await User.find(query).select('_id');

    const notificationDocs = users.map(u => ({
      recipientId: u._id,
      type: 'BROADCAST',
      title,
      message,
      channel,
      read: false
    }));

    if (notificationDocs.length > 0) {
      await Notification.insertMany(notificationDocs);
    }

    res.json({ success: true, message: `Broadcast sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
