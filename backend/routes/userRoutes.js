const express = require('express');
const router = express.Router();

const { getUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// GET /api/users?search=... — Admin only
router.get('/', authMiddleware, roleMiddleware('Admin'), getUsers);

module.exports = router;
