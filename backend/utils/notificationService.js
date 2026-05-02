const Notification = require('../models/Notification');

/**
 * Creates a notification record. Non-critical — errors are logged but not thrown.
 */
const createNotification = async ({ userId, type, message, projectId = null, taskId = null }) => {
  try {
    await Notification.create({ userId, type, message, projectId, taskId });
  } catch (err) {
    // Non-critical — log but don't throw
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = { createNotification };
