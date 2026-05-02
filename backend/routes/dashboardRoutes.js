const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/dashboard  — All authenticated users (response scoped by role)
router.get('/', authMiddleware, dashboardController.getDashboard);

module.exports = router;
