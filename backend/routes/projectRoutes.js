const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  createProjectSchema,
  updateProjectSchema,
  addMembersSchema,
  projectQuerySchema,
} = require('../middleware/validators/projectValidators');

// All project routes require authentication
router.use(authMiddleware);

// POST /api/projects  — Admin only
router.post(
  '/',
  roleMiddleware('Admin'),
  validateRequest(createProjectSchema),
  projectController.createProject
);

// GET /api/projects  — All authenticated users (scoped by role)
router.get(
  '/',
  validateRequest(projectQuerySchema, 'query'),
  projectController.getProjects
);

// GET /api/projects/:id  — All authenticated users (access-checked in controller)
router.get('/:id', projectController.getProjectById);

// PUT /api/projects/:id  — Admin only
router.put(
  '/:id',
  roleMiddleware('Admin'),
  validateRequest(updateProjectSchema),
  projectController.updateProject
);

// DELETE /api/projects/:id  — Admin only
router.delete('/:id', roleMiddleware('Admin'), projectController.deleteProject);

// POST /api/projects/:id/members  — Admin only
router.post(
  '/:id/members',
  roleMiddleware('Admin'),
  validateRequest(addMembersSchema),
  projectController.addMembers
);

// DELETE /api/projects/:id/members/:memberId  — Admin only
router.delete(
  '/:id/members/:memberId',
  roleMiddleware('Admin'),
  projectController.removeMember
);

module.exports = router;
