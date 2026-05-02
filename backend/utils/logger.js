const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console transport (colorized in dev)
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
    }),
    // File transport for errors
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
    }),
    // File transport for all logs
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    }),
  ],
  // Don't crash on unhandled exceptions — let the error handler deal with it
  exitOnError: false,
});

module.exports = logger;
