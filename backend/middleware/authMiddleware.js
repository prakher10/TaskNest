const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * authMiddleware
 * Verifies the JWT from the Authorization header (Bearer token).
 * Attaches the full user document to req.user on success.
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Access denied. No token provided.'));
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token has expired. Please log in again.'));
      }
      return next(new ApiError(401, 'Invalid token. Please log in again.'));
    }

    // 3. Check user still exists (handles deleted accounts)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ApiError(401, 'The user belonging to this token no longer exists.'));
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
