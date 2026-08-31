// notificationService.js
// Multi-channel notification dispatcher

import Notification from '../models/Notification.js';

export const sendNotification = async ({ recipientId, type, title, message, data, channel = 'IN_APP' }) => {
  try {
    const notification = await Notification.create({
      recipientId,
      type,
      title,
      message,
      data,
      channel,
      read: false
    });
    return notification;
  } catch (error) {
    console.error('Notification dispatch error:', error.message);
  }
};
