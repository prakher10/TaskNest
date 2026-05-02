const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const paginate = require('../utils/pagination');
const { createNotification } = require('../utils/notificationService');

/**
 * Helper: verify the requesting user has access to the project.
 * Returns the project document or throws an ApiError.
 */
const getAccessibleProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found.');
  if (!project.hasAccess(userId)) {
    throw new ApiError(403, 'You do not have access to this project.');
  }
  return project;
};

// ─── POST /api/tasks  (Admin only) ────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, projectId } = req.body;

    // Verify project exists and Admin has access (is creator)
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ApiError(404, 'Project not found.'));
    }
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project creator can create tasks.'));
    }

    // If assigning to someone, they must be a project member
    if (assignedTo) {
      const isMember = project.members.some((m) => m.toString() === assignedTo);
      if (!isMember) {
        return next(new ApiError(400, 'Assigned user is not a member of this project.'));
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo: assignedTo || null,
      projectId,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email role');
    await task.populate('projectId', 'title');
    await task.populate('createdBy', 'name email role');

    // Notify the assigned user (if different from the creator)
    if (task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: task.assignedTo._id,
        type: 'task_assigned',
        message: `You have been assigned to task "${task.title}" in project "${task.projectId.title}".`,
        projectId: task.projectId._id,
        taskId: task._id,
      });
    }

    return sendSuccess(res, 201, 'Task created successfully.', { task });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/tasks  (all authenticated users, scoped by role) ────────────────
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, projectId } = req.query;

    // Build filter based on role
    let filter = {};

    if (req.user.role === 'Admin') {
      // Admin sees all tasks in projects they created
      const adminProjects = await Project.find({ createdBy: req.user._id }).select('_id');
      const projectIds = adminProjects.map((p) => p._id);
      filter.projectId = { $in: projectIds };
    } else {
      // Member sees only tasks assigned to them, within projects they belong to
      const memberProjects = await Project.find({
        $or: [{ createdBy: req.user._id }, { members: req.user._id }],
      }).select('_id');
      const projectIds = memberProjects.map((p) => p._id);
      filter = {
        projectId: { $in: projectIds },
        assignedTo: req.user._id,
      };
    }

    // Optional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) {
      // Ensure the requested projectId is within the already-scoped set
      // Compare as strings to handle ObjectId vs string differences
      const scopedIds = filter.projectId.$in.map((id) => id.toString());
      if (!scopedIds.includes(projectId.toString())) {
        return next(new ApiError(403, 'You do not have access to this project.'));
      }
      filter.projectId = new mongoose.Types.ObjectId(projectId);
    }
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const total = await Task.countDocuments(filter);
    const { skip, limit, meta } = paginate(req.query, total);

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'title')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, 'Tasks retrieved.', { tasks }, meta);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'title description')
      .populate('createdBy', 'name email role');

    if (!task) {
      return next(new ApiError(404, 'Task not found.'));
    }

    // Verify user has access to the project this task belongs to
    await getAccessibleProject(task.projectId._id, req.user._id);

    // Members can only view tasks assigned to them
    if (
      req.user.role === 'Member' &&
      (!task.assignedTo || task.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      return next(new ApiError(403, 'You can only view tasks assigned to you.'));
    }

    return sendSuccess(res, 200, 'Task retrieved.', { task });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/tasks/:id  (Admin or assigned Member) ───────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ApiError(404, 'Task not found.'));
    }

    // Verify user has access to the project
    const project = await getAccessibleProject(task.projectId, req.user._id);

    const isAdmin = req.user.role === 'Admin';
    const isAssignedUser =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    // Admin must be the project creator; Member must be the assigned user
    if (isAdmin && project.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project creator can update tasks in this project.'));
    }
    if (!isAdmin && !isAssignedUser) {
      return next(new ApiError(403, 'You can only update tasks assigned to you.'));
    }

    // Members can only update status (not reassign, change priority, etc.)
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    // Capture old status for notification comparison
    const previousStatus = task.status;
    const previousAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;

    if (!isAdmin) {
      // Members are restricted to updating status only
      if (title || description || priority || dueDate || assignedTo) {
        return next(
          new ApiError(403, 'Members can only update the status of their assigned tasks.')
        );
      }
      if (status) task.status = status;
    } else {
      // Admin can update all fields
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;

      if (assignedTo !== undefined) {
        if (assignedTo === null) {
          task.assignedTo = null;
        } else {
          // New assignee must be a project member
          const isMember = project.members.some((m) => m.toString() === assignedTo);
          if (!isMember) {
            return next(new ApiError(400, 'Assigned user is not a member of this project.'));
          }
          task.assignedTo = assignedTo;
        }
      }
    }

    await task.save();
    await task.populate('assignedTo', 'name email role');
    await task.populate('projectId', 'title');
    await task.populate('createdBy', 'name email role');

    // Notify assigned user if status changed (and they are not the one making the update)
    if (
      status !== undefined &&
      status !== previousStatus &&
      task.assignedTo &&
      task.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      await createNotification({
        userId: task.assignedTo._id,
        type: 'task_status_updated',
        message: `Task "${task.title}" status changed to "${task.status}" in project "${task.projectId.title}".`,
        projectId: task.projectId._id,
        taskId: task._id,
      });
    }

    // Notify newly assigned user (admin reassigned the task to someone different)
    if (
      isAdmin &&
      assignedTo !== undefined &&
      assignedTo !== null &&
      assignedTo !== previousAssignedTo &&
      task.assignedTo &&
      task.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      await createNotification({
        userId: task.assignedTo._id,
        type: 'task_assigned',
        message: `You have been assigned to task "${task.title}" in project "${task.projectId.title}".`,
        projectId: task.projectId._id,
        taskId: task._id,
      });
    }

    return sendSuccess(res, 200, 'Task updated successfully.', { task });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/tasks/:id  (Admin only) ──────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ApiError(404, 'Task not found.'));
    }

    // Verify Admin is the project creator
    const project = await Project.findById(task.projectId);
    if (!project) {
      return next(new ApiError(404, 'Associated project not found.'));
    }
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project creator can delete tasks.'));
    }

    await task.deleteOne();

    return sendSuccess(res, 200, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
