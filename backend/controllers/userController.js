const User = require('../models/User');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/users
 * Admin can search all verified users to add to projects.
 * Returns name, email, role — no sensitive data.
 */
const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const filter = { isVerified: true };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select('name email role createdAt')
      .sort({ name: 1 })
      .limit(50);

    return sendSuccess(res, 200, 'Users retrieved.', { users });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers };
