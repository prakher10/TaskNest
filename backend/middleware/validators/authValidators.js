const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('Admin', 'Member').default('Member'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
    'any.required': 'OTP is required',
  }),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

module.exports = { signupSchema, loginSchema, verifyOtpSchema, resendOtpSchema };
