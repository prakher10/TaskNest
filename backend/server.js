/**
 * server.js — Entry point
 *
 * Responsibilities:
 *  1. Load environment variables
 *  2. Connect to MongoDB
 *  3. Start the HTTP server
 *  4. Handle unhandled rejections / uncaught exceptions gracefully
 */

console.log('🚀 Server script is starting...');
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// ─── Graceful shutdown helper ──────────────────────────────────────────────────
let server;

const shutdown = (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully…`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10 s if connections are still open
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
};

// ─── Unhandled promise rejections ─────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  shutdown('unhandledRejection');
});

// ─── Uncaught exceptions ──────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

// ─── SIGTERM / SIGINT ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Boot sequence ─────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
};

start();
