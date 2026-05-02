const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Centralised error handling middleware.
 * Must be registered LAST in app.js (after all routes).
 *
 * Handles:
 *  - ApiError (our custom operational errors)
 *  - Mongoose CastError (invalid ObjectId)
 *  - Mongoose ValidationError
 *  - Mongoose duplicate key error (code 11000)
 *  - JWT errors (already converted to ApiError in authMiddleware)
 *  - Generic / unexpected errors
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // ── Mongoose: invalid ObjectId ─────────────────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  }

  // ── Mongoose: validation errors ────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, 'Validation failed');
    error.errors = messages;
  }

  // ── MongoDB: duplicate key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    error = new ApiError(409, `${field} '${value}' is already in use.`);
  }

  // ── Determine final status code ────────────────────────────────────────────
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log non-operational (unexpected) errors at error level
  if (!error.isOperational) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${message}`, { stack: err.stack });
  }

  const response = {
    success: false,
    message,
  };

  // Attach validation errors array if present
  if (error.errors) {
    response.errors = error.errors;
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
