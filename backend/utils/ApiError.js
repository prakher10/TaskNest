/**
 * Custom API error class.
 * Extends the native Error so it can be thrown anywhere and caught by
 * the centralized error handler middleware.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (e.g. 400, 401, 403, 404)
   * @param {string} message     - Human-readable error message
   * @param {boolean} isOperational - Operational errors are expected (validation,
   *   auth failures). Non-operational errors are programming bugs.
   */
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Capture stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
