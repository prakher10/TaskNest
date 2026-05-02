const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} = require('../middleware/validators/authValidators');

// POST /api/auth/signup       — register + send OTP
router.post('/signup', validateRequest(signupSchema), authController.signup);

// POST /api/auth/verify-otp   — verify OTP → get JWT
router.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOtp);

// POST /api/auth/resend-otp   — resend a fresh OTP
router.post('/resend-otp', validateRequest(resendOtpSchema), authController.resendOtp);

// POST /api/auth/login        — login (verified accounts only)
router.post('/login', validateRequest(loginSchema), authController.login);

// GET  /api/auth/me           — get current user (protected)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
