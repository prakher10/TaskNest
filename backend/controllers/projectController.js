const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const paginate = require('../utils/pagination');
const { createNotification } = require('../utils/notificationService');

// ─── POST /api/projects  (Admin only) ─────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      // Creator is automatically a member
      members: [req.user._id],
    });

    await project.populate('createdBy', 'name email role');

    return sendSuccess(res, 201, 'Project created successfully.', { project });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/projects  (all authenticated users) ─────────────────────────────
const getProjects = async (req, res, next) => {
  try {
    const { search } = req.query;

    // Build base filter:
    // Admin sees all projects they created.
    // Member sees only projects where they are a member or creator.
    let filter = {};
    if (req.user.role === 'Admin') {
      filter = { createdBy: req.user._id };
    } else {
      filter = {
        $or: [
          { createdBy: req.user._id },
          { members: req.user._id },
        ],
      };
    }

    // Optional text search
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const total = await Project.countDocuments(filter);
    const { skip, limit, meta } = paginate(req.query, total);

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, 'Projects retrieved.', { projects }, meta);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return next(new ApiError(404, 'Project not found.'));
    }

    // Access control: user must be creator or member
    if (!project.hasAccess(req.user._id)) {
      return next(new ApiError(403, 'You do not have access to this project.'));
    }

    return sendSuccess(res, 200, 'Project retrieved.', { project });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/projects/:id  (Admin only) ──────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ApiError(404, 'Project not found.'));
    }

    // Only the Admin who created the project can update it
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project creator can update this project.'));
    }

    const { title, description } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate('createdBy', 'name email role');
    await project.populate('members', 'name email role');

    // Notify all project members (except the updater) about the project update
    const memberIds = project.members
      .map((m) => m._id.toString())
      .filter((id) => id !== req.user._id.toString());

    await Promise.all(
      memberIds.map((memberId) =>
        createNotification({
          userId: memberId,
          type: 'project_updated',
          message: `Project "${project.title}" has been updated.`,
          projectId: project._id,
        })
      )
    );

    return sendSuccess(res, 200, 'Project updated successfully.', { project });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/projects/:id  (Admin only) ───────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ApiError(404, 'Project not found.'));
    }

    // Only the Admin who created the project can delete it
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project creator can delete this project.'));
    }

    // Cascade-delete all tasks belonging to this project
    await Task.deleteMany({ projectId: project._id });

    await project.deleteOne();

    return sendSuccess(res, 200, 'Project and all its tasks deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/projects/:id/members  (Admin only) ─────────────────────────────
const addMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ApiError(404, 'Project not found.'));
    }

    // Only the Admin who created the project can manage members
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project creator can manage members.'));
    }

    const { memberIds } = req.body;

    // Validate that all provided IDs are valid ObjectIds and exist in DB
    const objectIds = memberIds.map((id) => new mongoose.Types.ObjectId(id));
    const users = await User.find({ _id: { $in: objectIds } }).select('_id');

    if (users.length !== memberIds.length) {
      return next(new ApiError(400, 'One or more user IDs are invalid or do not exist.'));
    }

    // Add members (avoid duplicates using $addToSet)
    await Project.findByIdAndUpdate(
      project._id,
      { $addToSet: { members: { $each: objectIds } } },
      { new: true }
    );

    const updated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    // Notify each newly added member (skip the project creator / requester)
    const newMemberIds = objectIds
      .map((id) => id.toString())
      .filter((id) => id !== req.user._id.toString());

    await Promise.all(
      newMemberIds.map((memberId) =>
        createNotification({
          userId: memberId,
          type: 'project_member_added',
          message: `You have been added to project "${updated.title}".`,
          projectId: updated._id,
        })
      )
    );

    return sendSuccess(res, 200, 'Members added successfully.', { project: updated });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/projects/:id/members/:memberId  (Admin only) ─────────────────
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ApiError(404, 'Project not found.'));
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Only the project creator can manage members.'));
    }

    const { memberId } = req.params;

    // Cannot remove the creator
    if (project.createdBy.toString() === memberId) {
      return next(new ApiError(400, 'Cannot remove the project creator from members.'));
    }

    await Project.findByIdAndUpdate(project._id, {
      $pull: { members: new mongoose.Types.ObjectId(memberId) },
    });

    const updated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    // Notify the removed member
    if (memberId !== req.user._id.toString()) {
      await createNotification({
        userId: memberId,
        type: 'project_member_removed',
        message: `You have been removed from project "${updated.title}".`,
        projectId: updated._id,
      });
    }

    return sendSuccess(res, 200, 'Member removed successfully.', { project: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMembers,
  removeMember,
};
