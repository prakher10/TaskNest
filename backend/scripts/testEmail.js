/**
 * Quick email test — run this to verify your SMTP config works.
 *
 * Usage:
 *   node scripts/testEmail.js your@email.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sendOtpEmail } = require('../utils/mailer');

const to = process.argv[2];

if (!to) {
  console.error('Usage: node scripts/testEmail.js your@email.com');
  process.exit(1);
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('EMAIL_USER and EMAIL_PASS are not set in .env');
  process.exit(1);
}

console.log(`Sending test OTP email to: ${to}`);
console.log(`Sending FROM: ${process.env.EMAIL_USER}`);

sendOtpEmail(to, 'Test User', '123456')
  .then(() => {
    console.log('\n✅ Email sent successfully! Check your inbox.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed to send email:', err.message);
    console.error('\nCommon fixes:');
    console.error('  1. Make sure 2-Step Verification is ON in your Google account');
    console.error('  2. Use an App Password (not your real Gmail password)');
    console.error('  3. Remove spaces from the app password in .env');
    process.exit(1);
  });
