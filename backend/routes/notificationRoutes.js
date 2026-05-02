const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getNotifications,
  markOneRead,
  markAllRead,
  clearAll,
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);          // must come before /:id/read
router.put('/:id/read', markOneRead);
router.delete('/', clearAll);

module.exports = router;
