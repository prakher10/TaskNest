const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

// ─── GET /api/dashboard ───────────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    if (req.user.role === 'Admin') {
      // ── Admin dashboard ──────────────────────────────────────────────────────
      // Scope: all projects created by this Admin

      const adminProjects = await Project.find({ createdBy: req.user._id })
        .populate('members', 'name email role')
        .sort({ createdAt: -1 });

      const projectIds = adminProjects.map((p) => p._id);

      // Aggregate task stats across all admin projects
      const [taskStats] = await Task.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
            },
            pendingTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
            },
            inProgressTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] },
            },
          },
        },
      ]);

      // Overdue: not completed AND dueDate < now
      const overdueTasks = await Task.countDocuments({
        projectId: { $in: projectIds },
        status: { $ne: 'Completed' },
        dueDate: { $lt: now, $exists: true, $ne: null },
      });

      // Per-project progress (% of completed tasks)
      const projectsWithProgress = await Promise.all(
        adminProjects.map(async (project) => {
          const total = await Task.countDocuments({ projectId: project._id });
          const completed = await Task.countDocuments({
            projectId: project._id,
            status: 'Completed',
          });
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          return {
            _id: project._id,
            title: project.title,
            description: project.description,
            membersCount: project.members.length,
            members: project.members,
            progress,
            createdAt: project.createdAt,
          };
        })
      );

      // Recent tasks (last 5)
      const recentTasks = await Task.find({ projectId: { $in: projectIds } })
        .populate('assignedTo', 'name email')
        .populate('projectId', 'title')
        .sort({ createdAt: -1 })
        .limit(5);

      return sendSuccess(res, 200, 'Admin dashboard data retrieved.', {
        stats: {
          totalTasks: taskStats?.totalTasks || 0,
          completedTasks: taskStats?.completedTasks || 0,
          pendingTasks: taskStats?.pendingTasks || 0,
          inProgressTasks: taskStats?.inProgressTasks || 0,
          overdueTasks,
          totalProjects: adminProjects.length,
        },
        projects: projectsWithProgress,
        recentTasks,
      });
    } else {
      // ── Member dashboard ─────────────────────────────────────────────────────
      // Scope: only tasks assigned to this member

      const memberProjects = await Project.find({
        $or: [{ createdBy: req.user._id }, { members: req.user._id }],
      }).select('_id title description');

      const projectIds = memberProjects.map((p) => p._id);

      const [taskStats] = await Task.aggregate([
        {
          $match: {
            projectId: { $in: projectIds },
            assignedTo: req.user._id,
          },
        },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
            },
            pendingTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
            },
            inProgressTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] },
            },
          },
        },
      ]);

      const overdueTasks = await Task.countDocuments({
        projectId: { $in: projectIds },
        assignedTo: req.user._id,
        status: { $ne: 'Completed' },
        dueDate: { $lt: now, $exists: true, $ne: null },
      });

      // Recent tasks assigned to this member
      const recentTasks = await Task.find({
        projectId: { $in: projectIds },
        assignedTo: req.user._id,
      })
        .populate('projectId', 'title')
        .sort({ createdAt: -1 })
        .limit(5);

      return sendSuccess(res, 200, 'Member dashboard data retrieved.', {
        stats: {
          totalTasks: taskStats?.totalTasks || 0,
          completedTasks: taskStats?.completedTasks || 0,
          pendingTasks: taskStats?.pendingTasks || 0,
          inProgressTasks: taskStats?.inProgressTasks || 0,
          overdueTasks,
          totalProjects: memberProjects.length,
        },
        projects: memberProjects,
        recentTasks,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
