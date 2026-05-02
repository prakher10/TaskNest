const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: { values: ['Admin', 'Member'], message: 'Role must be Admin or Member' },
      default: 'Member',
    },

    // ── Avatar ─────────────────────────────────────────────────────────────
    avatar: {
      type: String,   // base64 data-URL  e.g. "data:image/jpeg;base64,..."
      default: null,
    },

    // ── Email verification ──────────────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false, // never returned in queries by default
    },
    otpExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance: compare passwords ──────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance: generate a 6-digit OTP and set expiry ─────────────────────────
userSchema.methods.generateOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const expiresMin = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + expiresMin * 60 * 1000);
  return otp;
};

// ─── Instance: safe public profile ────────────────────────────────────────────
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    isVerified: this.isVerified,
    avatar: this.avatar ?? null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
