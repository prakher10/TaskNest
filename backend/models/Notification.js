const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_status_updated',
      'task_due_soon',
      'task_overdue',
      'project_member_added',
      'project_member_removed',
      'project_updated',
    ],
    required: true,
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  // Optional references for context
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
