const { AuditLog } = require('../models');

/**
 * Audit logging middleware
 * Logs API actions to the audit log
 * 
 * @param {object} options - Configuration options
 * @param {string} options.action - The action name (e.g., 'USER_CREATE', 'USER_UPDATE')
 * @param {string} options.resource - The resource being accessed (e.g., 'users', 'roles')
 * @param {function} options.getResourceId - Function to extract resource ID from request
 * @param {function} options.getDetails - Function to extract additional details from request
 * @param {boolean} options.logRequestBody - Whether to log the request body
 * @param {string[]} options.sensitiveFields - Fields to exclude from logging
 */
const auditLog = (options = {}) => {
  const {
    action,
    resource,
    getResourceId = null,
    getDetails = null,
    logRequestBody = false,
    sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey']
  } = options;

  return async (req, res, next) => {
    // Store original json method to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Restore original method
      res.json = originalJson;
      
      // Log after response is sent
      const logData = async () => {
        try {
          // Skip logging for unsuccessful responses unless specified
          if (res.statusCode >= 400 && !options.logErrors) {
            return;
          }

          let resourceId = null;
          if (getResourceId) {
            resourceId = await getResourceId(req, res, data);
          } else if (req.params.id) {
            resourceId = req.params.id;
          } else if (data?.data?.id) {
            resourceId = data.data.id;
          }

          let details = {};
          if (logRequestBody && req.body) {
            details = sanitizeBody(req.body, sensitiveFields);
          }
          if (getDetails) {
            const customDetails = await getDetails(req, res, data);
            details = { ...details, ...customDetails };
          }

          // Add response status
          details.responseStatus = res.statusCode;

          await AuditLog.create({
            userId: req.user?.id,
            action: action || `${req.method}_${resource?.toUpperCase() || 'UNKNOWN'}`,
            resource: resource || req.originalUrl,
            resourceId,
            details: Object.keys(details).length > 0 ? details : null,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      };

      // Execute logging without blocking response
      logData();
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Sanitize request body by removing sensitive fields
 */
const sanitizeBody = (body, sensitiveFields) => {
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
    
    // Handle nested objects
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeBody(sanitized[key], sensitiveFields);
      }
    }
  }
  
  return sanitized;
};

/**
 * Pre-defined audit log configurations for common actions
 */
const auditActions = {
  // Auth actions
  LOGIN: { action: 'LOGIN', resource: 'auth' },
  LOGOUT: { action: 'LOGOUT', resource: 'auth' },
  REGISTER: { action: 'REGISTER', resource: 'auth' },
  TOKEN_REFRESH: { action: 'TOKEN_REFRESH', resource: 'auth' },
  PASSWORD_CHANGE: { action: 'PASSWORD_CHANGE', resource: 'auth', logRequestBody: true },
  
  // User actions
  USER_CREATE: { action: 'CREATE', resource: 'users', logRequestBody: true },
  USER_UPDATE: { action: 'UPDATE', resource: 'users', logRequestBody: true },
  USER_DELETE: { action: 'DELETE', resource: 'users' },
  USER_READ: { action: 'READ', resource: 'users' },
  USER_ROLE_ASSIGN: { action: 'ROLE_ASSIGN', resource: 'users', logRequestBody: true },
  
  // Role actions
  ROLE_CREATE: { action: 'CREATE', resource: 'roles', logRequestBody: true },
  ROLE_UPDATE: { action: 'UPDATE', resource: 'roles', logRequestBody: true },
  ROLE_DELETE: { action: 'DELETE', resource: 'roles' },
  ROLE_READ: { action: 'READ', resource: 'roles' },
  ROLE_PERMISSION_ASSIGN: { action: 'PERMISSION_ASSIGN', resource: 'roles', logRequestBody: true },
  
  // Permission actions
  PERMISSION_READ: { action: 'READ', resource: 'permissions' },
  
  // System actions
  SETTINGS_READ: { action: 'READ', resource: 'settings' },
  SETTINGS_UPDATE: { action: 'UPDATE', resource: 'settings', logRequestBody: true },
  AUDIT_LOG_READ: { action: 'READ', resource: 'audit_logs' }
};

module.exports = {
  auditLog,
  auditActions,
  sanitizeBody
};
