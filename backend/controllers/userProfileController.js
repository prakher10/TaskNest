const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

// ─── GET /api/profile ─────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Personal task stats
    const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'Completed' }),
      Task.countDocuments({ assignedTo: userId, status: { $ne: 'Completed' } }),
    ]);

    return sendSuccess(res, 200, 'Profile retrieved.', {
      user: req.user.toPublicJSON(),
      stats: { totalTasks, completedTasks, pendingTasks },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name && name.trim()) user.name = name.trim();

    if (email && email.trim() && email !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return next(new ApiError(409, 'This email is already in use.'));
      user.email = email.toLowerCase().trim();
    }

    // Avatar: accept a base64 data-URL, max ~2 MB
    if (avatar !== undefined) {
      if (avatar === null) {
        user.avatar = null;
      } else if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
        // Rough size check: base64 string length * 0.75 ≈ bytes
        const approxBytes = avatar.length * 0.75;
        if (approxBytes > 2 * 1024 * 1024) {
          return next(new ApiError(400, 'Avatar image must be smaller than 2 MB.'));
        }
        user.avatar = avatar;
      }
    }

    await user.save();
    return sendSuccess(res, 200, 'Profile updated successfully.', {
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/profile/password ────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return next(new ApiError(400, 'Current password is incorrect.'));

    if (newPassword.length < 8)
      return next(new ApiError(400, 'New password must be at least 8 characters.'));

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    return sendSuccess(res, 200, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
