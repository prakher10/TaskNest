const ApiError = require('../utils/ApiError');

/**
 * validateRequest
 * Joi-based request validation middleware factory.
 *
 * Usage:
 *   router.post('/signup', validateRequest(signupSchema), authController.signup);
 *
 * @param {Joi.Schema} schema  - Joi schema to validate against
 * @param {'body'|'query'|'params'} target - Which part of the request to validate
 */
const validateRequest = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,   // collect ALL errors, not just the first
      stripUnknown: true,  // remove unknown keys silently
      convert: true,       // coerce types (e.g. string → number)
    });

    if (error) {
      const messages = error.details.map((d) => d.message.replace(/['"]/g, ''));
      const err = new ApiError(400, 'Validation failed');
      err.errors = messages;
      return next(err);
    }

    // Replace the request target with the sanitised/coerced value
    req[target] = value;
    next();
  };
};

module.exports = validateRequest;
