const Joi = require('joi');

const createProjectSchema = Joi.object({
  title: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Title must be at least 2 characters',
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Project title is required',
  }),
  description: Joi.string().max(2000).allow('').default(''),
});

const updateProjectSchema = Joi.object({
  title: Joi.string().min(2).max(200).messages({
    'string.min': 'Title must be at least 2 characters',
    'string.max': 'Title cannot exceed 200 characters',
  }),
  description: Joi.string().max(2000).allow(''),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const addMembersSchema = Joi.object({
  memberIds: Joi.array()
    .items(Joi.string().pattern(/^[a-f\d]{24}$/i).message('Invalid user ID format'))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one member ID is required',
      'any.required': 'memberIds is required',
    }),
});

const projectQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(200).allow(''),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMembersSchema,
  projectQuerySchema,
};
