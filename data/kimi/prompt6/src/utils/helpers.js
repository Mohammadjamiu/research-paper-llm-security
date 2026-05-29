const { ZodError } = require('zod');

/**
 * Async handler wrapper for Express routes
 * Automatically catches errors and passes them to next()
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation middleware factory
 * Validates request against Zod schema
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: formatted
        });
      }
      next(error);
    }
  };
};

/**
 * Pagination helper
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Create paginated response
 */
const paginatedResponse = (data, total, pagination) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Success response helper
 */
const successResponse = (data, message = null) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return response;
};

/**
 * Error response helper
 */
const errorResponse = (error, statusCode = 400) => {
  const err = new Error(error);
  err.statusCode = statusCode;
  return err;
};

/**
 * Filter object keys
 */
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
};

/**
 * Omit object keys
 */
const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Format date to ISO string
 */
const formatDate = (date = new Date()) => {
  return date.toISOString();
};

/**
 * Parse boolean from string
 */
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
};

module.exports = {
  asyncHandler,
  validate,
  getPagination,
  paginatedResponse,
  successResponse,
  errorResponse,
  pick,
  omit,
  generateRandomString,
  formatDate,
  parseBoolean
};
