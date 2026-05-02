const ApiError = require('../utils/ApiError');

/**
 * roleMiddleware
 * Factory function — returns a middleware that restricts access to the
 * specified roles.
 *
 * Usage:
 *   router.post('/projects', authMiddleware, roleMiddleware('Admin'), createProject);
 *   router.get('/projects', authMiddleware, roleMiddleware('Admin', 'Member'), getProjects);
 *
 * @param {...string} roles - Allowed roles (e.g. 'Admin', 'Member')
 */
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`
        )
      );
    }

    next();
  };
};

module.exports = roleMiddleware;
