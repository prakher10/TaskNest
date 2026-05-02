const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Reusable Nodemailer transporter.
 * Reads credentials from environment variables so nothing is hardcoded.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email.
 * @param {object} options
 * @param {string} options.to      - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html    - HTML body
 */
const sendMail = async ({ to, subject, html }) => {
  const from = process.env.EMAIL_FROM || `"TaskNest" <${process.env.EMAIL_USER}>`;

  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    logger.info(`Email sent to ${to} — MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    throw err;
  }
};

/**
 * Send the OTP verification email.
 * @param {string} to   - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp  - 6-digit OTP code
 */
const sendOtpEmail = (to, name, otp) => {
  const expiresMin = process.env.OTP_EXPIRES_MINUTES || 10;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
        .wrapper { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header p  { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
        .body { padding: 36px 40px; }
        .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
        .otp-box { background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 10px; text-align: center; padding: 24px; margin: 24px 0; }
        .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #6366f1; font-family: 'Courier New', monospace; }
        .note { font-size: 13px; color: #9ca3af; margin-top: 8px; }
        .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>TaskNest</h1>
          <p>Project Management Platform</p>
        </div>
        <div class="body">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thanks for signing up! Use the verification code below to confirm your email address.</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="note">Expires in ${expiresMin} minutes</div>
          </div>
          <p>If you didn't create a TaskNest account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} TaskNest. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({ to, subject: 'Your TaskNest verification code', html });
};

module.exports = { sendMail, sendOtpEmail };
