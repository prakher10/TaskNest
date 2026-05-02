const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} = require('../middleware/validators/taskValidators');

// All task routes require authentication
router.use(authMiddleware);

// POST /api/tasks  — Admin only
router.post(
  '/',
  roleMiddleware('Admin'),
  validateRequest(createTaskSchema),
  taskController.createTask
);

// GET /api/tasks  — All authenticated users (scoped by role)
router.get(
  '/',
  validateRequest(taskQuerySchema, 'query'),
  taskController.getTasks
);

// GET /api/tasks/:id  — All authenticated users (access-checked in controller)
router.get('/:id', taskController.getTaskById);

// PUT /api/tasks/:id  — Admin or assigned Member
router.put(
  '/:id',
  validateRequest(updateTaskSchema),
  taskController.updateTask
);

// DELETE /api/tasks/:id  — Admin only
router.delete('/:id', roleMiddleware('Admin'), taskController.deleteTask);

module.exports = router;
