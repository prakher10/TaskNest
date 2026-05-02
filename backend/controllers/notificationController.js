const Notification = require('../models/Notification');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { sendSuccess } = require('../utils/apiResponse');
const { createNotification } = require('../utils/notificationService');

/**
 * Check for tasks due within 24 hours or overdue for the current user,
 * and auto-create notifications if not already created in the last 24 hours.
 */
const checkDeadlineNotifications = async (userId) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find tasks assigned to user that are not completed and have a dueDate
    const tasks = await Task.find({
      assignedTo: userId,
      status: { $ne: 'Completed' },
      dueDate: { $ne: null },
    }).select('_id title dueDate projectId');

    for (const task of tasks) {
      const due = new Date(task.dueDate);
      const isOverdue = due < now;
      const isDueSoon = !isOverdue && due <= in24h;

      if (!isOverdue && !isDueSoon) continue;

      const type = isOverdue ? 'task_overdue' : 'task_due_soon';

      // Deduplication: check if a notification of this type for this task was created in the last 24h
      const existing = await Notification.findOne({
        userId,
        type,
        taskId: task._id,
        createdAt: { $gte: yesterday },
      });

      if (!existing) {
        const message = isOverdue
          ? `Task "${task.title}" is overdue.`
          : `Task "${task.title}" is due within 24 hours.`;

        await createNotification({
          userId,
          type,
          message,
          projectId: task.projectId,
          taskId: task._id,
        });
      }
    }
  } catch (err) {
    console.error('Failed to check deadline notifications:', err.message);
  }
};

// ─── GET /api/notifications ───────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    // Auto-create deadline notifications before returning the list
    await checkDeadlineNotifications(req.user._id);

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return sendSuccess(res, 200, 'Notifications retrieved.', { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────
const markOneRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.read = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return sendSuccess(res, 200, 'Notification marked as read.', { notification, unreadCount });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    return sendSuccess(res, 200, 'All notifications marked as read.', { unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/notifications ────────────────────────────────────────────────
const clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    return sendSuccess(res, 200, 'All notifications cleared.', { unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markOneRead, markAllRead, clearAll };
