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
  ],
  // Don't crash on unhandled exceptions — let the error handler deal with it
  exitOnError: false,
});

// Add file transports only if NOT in production or if you want them locally
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
    })
  );
  logger.add(
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    })
  );
}

module.exports = logger;
