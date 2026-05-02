const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(300).required().messages({
    'string.min': 'Title must be at least 2 characters',
    'string.max': 'Title cannot exceed 300 characters',
    'any.required': 'Task title is required',
  }),
  description: Joi.string().max(5000).allow('').default(''),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed').default('Pending'),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  dueDate: Joi.date().iso().allow(null),
  assignedTo: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .allow(null)
    .message('Invalid user ID format'),
  projectId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .messages({
      'any.required': 'projectId is required',
      'string.pattern.base': 'Invalid project ID format',
    }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(300),
  description: Joi.string().max(5000).allow(''),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed'),
  priority: Joi.string().valid('Low', 'Medium', 'High'),
  dueDate: Joi.date().iso().allow(null),
  assignedTo: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .allow(null)
    .message('Invalid user ID format'),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const taskQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed'),
  priority: Joi.string().valid('Low', 'Medium', 'High'),
  search: Joi.string().max(200).allow(''),
  projectId: Joi.string().pattern(/^[a-f\d]{24}$/i).message('Invalid project ID format'),
});

module.exports = { createTaskSchema, updateTaskSchema, taskQuerySchema };
