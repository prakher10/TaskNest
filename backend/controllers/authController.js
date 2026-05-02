const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { sendOtpEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

/** Generate a signed JWT */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
// Step 1: create unverified account → send OTP email
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check duplicate
    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return next(new ApiError(409, 'An account with this email already exists.'));
    }

    let user;
    if (existing && !existing.isVerified) {
      // Re-use the unverified account — just update it and resend OTP
      existing.name = name;
      existing.password = password; // will be re-hashed by pre-save
      existing.role = role || 'Member';
      user = existing;
    } else {
      user = new User({ name, email, password, role: role || 'Member', isVerified: false });
    }

    const otp = user.generateOtp();
    await user.save();

    // Send OTP email — if email is not configured, log it instead (dev mode)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendOtpEmail(email, name, otp);
      } catch (mailErr) {
        logger.error(`OTP email failed for ${email}: ${mailErr.message}`);
        // Don't block signup if email fails — return OTP in dev mode
        if (process.env.NODE_ENV === 'development') {
          return sendSuccess(res, 200, 'OTP generated (dev mode).', {
            devOtp: otp, 
          });
        }
        return next(new ApiError(500, 'Failed to send verification email. Please try again.'));
      }
    } else {
      // Email not configured — expose OTP in response for development
      logger.warn(`EMAIL not configured. DEV OTP for ${email}: ${otp}`);
      return sendSuccess(res, 200, 'OTP generated (email not configured — see devOtp).', {
        devOtp: otp,
      });
    }

    return sendSuccess(res, 200, `Verification code sent to ${email}. Please check your inbox.`);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
// Step 2: verify OTP → mark account verified → return JWT
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Explicitly select otp fields
    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) {
      return next(new ApiError(404, 'No account found with this email.'));
    }
    if (user.isVerified) {
      return next(new ApiError(400, 'This account is already verified. Please log in.'));
    }
    if (!user.otp || !user.otpExpires) {
      return next(new ApiError(400, 'No verification code found. Please sign up again.'));
    }
    if (new Date() > user.otpExpires) {
      return next(new ApiError(400, 'Verification code has expired. Please sign up again to get a new code.'));
    }
    if (user.otp !== otp.trim()) {
      return next(new ApiError(400, 'Invalid verification code.'));
    }

    // Mark verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Email verified successfully. Welcome to TaskNest!', {
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, 'No account found with this email.'));
    }
    if (user.isVerified) {
      return next(new ApiError(400, 'This account is already verified.'));
    }

    const otp = user.generateOtp();
    await user.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendOtpEmail(email, user.name, otp);
      } catch (mailErr) {
        logger.error(`Resend OTP email failed for ${email}: ${mailErr.message}`);
        if (process.env.NODE_ENV === 'development') {
          return sendSuccess(res, 200, 'New OTP generated (dev mode).', { devOtp: otp });
        }
        return next(new ApiError(500, 'Failed to send email. Please try again.'));
      }
    } else {
      logger.warn(`EMAIL not configured. DEV OTP for ${email}: ${otp}`);
      return sendSuccess(res, 200, 'New OTP generated (email not configured).', { devOtp: otp });
    }

    return sendSuccess(res, 200, `New verification code sent to ${email}.`);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    // Block unverified accounts
    if (!user.isVerified) {
      return next(new ApiError(403, 'Please verify your email before logging in.'));
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Logged in successfully.', {
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'User profile retrieved.', {
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, getMe };
