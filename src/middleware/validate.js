const Joi = require('joi');

/**
 * Middleware factory: validates req.body against a Joi schema.
 * Returns 400 with a clear message on failure.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // collect ALL errors, not just the first
    stripUnknown: true,  // remove fields not in schema (security)
  });

  if (error) {
    const messages = error.details.map((d) => d.message).join('; ');
    const err = new Error(messages);
    err.statusCode = 400;
    return next(err);
  }

  req.body = value; // use the sanitized/coerced value
  next();
};

// ─── Auth Schemas ────────────────────────────────────────────────────────────

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(1).required().messages({
    'any.required': 'Password is required',
  }),
});

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[0-9]/, 'number')
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.name': 'Password must contain at least one {#name}',
      'any.required': 'Password is required',
    }),
  role: Joi.string().valid('employee', 'manager', 'admin').default('employee'),
});

// ─── Task Schemas ─────────────────────────────────────────────────────────────

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required().messages({
    'any.required': 'Title is required',
    'string.max': 'Title cannot exceed 255 characters',
  }),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').default('pending'),
  due_date: Joi.date().iso().allow(null, '').optional(),
  assigned_to: Joi.number().integer().positive().allow(null, '').empty('').optional(),
  client_id: Joi.number().integer().positive().allow(null, '').empty('').optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
  due_date: Joi.date().iso().allow(null, '').optional(),
  assigned_to: Joi.number().integer().positive().allow(null, '').empty('').optional(),
  client_id: Joi.number().integer().positive().allow(null, '').empty('').optional(),
});

// ─── Client Schemas ───────────────────────────────────────────────────────────

const createClientSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required().messages({
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().trim().allow('', null).optional(),
  phone: Joi.string().trim().max(30).allow('', null).optional(),
  company: Joi.string().trim().max(150).allow('', null).optional(),
  notes: Joi.string().trim().max(2000).allow('', null).optional(),
});

const updateClientSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).optional(),
  email: Joi.string().email().lowercase().trim().allow('', null).optional(),
  phone: Joi.string().trim().max(30).allow('', null).optional(),
  company: Joi.string().trim().max(150).allow('', null).optional(),
  notes: Joi.string().trim().max(2000).allow('', null).optional(),
});

// ─── User Schemas ─────────────────────────────────────────────────────────────

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[0-9]/, 'number')
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.name': 'Password must contain at least one {#name}',
    }),
  role: Joi.string().valid('employee', 'manager', 'admin').default('employee'),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  role: Joi.string().valid('employee', 'manager', 'admin').optional(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[0-9]/, 'number')
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.name': 'Password must contain at least one {#name}',
    }),
});

// ─── AI Schema ────────────────────────────────────────────────────────────────

const aiAskSchema = Joi.object({
  prompt: Joi.string().trim().min(1).max(2000).required().messages({
    'any.required': 'Prompt is required',
    'string.max': 'Prompt cannot exceed 2000 characters',
  }),
});

module.exports = {
  validate,
  schemas: {
    login: loginSchema,
    register: registerSchema,
    createTask: createTaskSchema,
    updateTask: updateTaskSchema,
    createClient: createClientSchema,
    updateClient: updateClientSchema,
    createUser: createUserSchema,
    updateUser: updateUserSchema,
    aiAsk: aiAskSchema,
  },
};
