const { AuditLog } = require('../models');

/**
 * Require specific permission(s)
 * @param {string|string[]} permissions - Single permission or array of permissions
 * @param {object} options - Options object
 * @param {string} options.strategy - 'all' (default) or 'any' - whether user needs all or any of the permissions
 */
const requirePermission = (permissions, options = {}) => {
  const { strategy = 'all' } = options;
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      // Super admin has all permissions
      if (req.user.hasPermission('system:admin')) {
        return next();
      }
      
      const hasPermission = strategy === 'any'
        ? req.user.hasAnyPermission(requiredPermissions)
        : req.user.hasAllPermissions(requiredPermissions);
      
      if (!hasPermission) {
        // Log unauthorized access attempt
        await AuditLog.create({
          userId: req.user.id,
          action: 'ACCESS_DENIED',
          resource: req.originalUrl,
          details: {
            requiredPermissions,
            strategy,
            method: req.method,
            ip: req.ip
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Required permission(s): ${requiredPermissions.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Require specific role(s)
 * @param {string|string[]} roles - Single role or array of roles
 * @param {object} options - Options object
 * @param {string} options.strategy - 'all' (default) or 'any' - whether user needs all or any of the roles
 */
const requireRole = (roles, options = {}) => {
  const { strategy = 'any' } = options;
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      // Super admin has all roles implicitly
      if (req.user.hasPermission('system:admin')) {
        return next();
      }
      
      const hasRole = strategy === 'any'
        ? requiredRoles.some(role => req.user.hasRole(role))
        : requiredRoles.every(role => req.user.hasRole(role));
      
      if (!hasRole) {
        // Log unauthorized access attempt
        await AuditLog.create({
          userId: req.user.id,
          action: 'ACCESS_DENIED',
          resource: req.originalUrl,
          details: {
            requiredRoles,
            strategy,
            method: req.method,
            userRoles: req.user.roles.map(r => r.name)
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Required role(s): ${requiredRoles.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Require ownership or specific permission
 * Useful for resources where users can access their own data
 * @param {string} permission - Permission required if not owner
 * @param {function} getOwnerId - Function to extract owner ID from request
 */
const requireOwnerOrPermission = (permission, getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      // Super admin bypass
      if (req.user.hasPermission('system:admin')) {
        return next();
      }
      
      // Check if user has the permission
      if (req.user.hasPermission(permission)) {
        return next();
      }
      
      // Check if user is the owner
      const ownerId = await getOwnerId(req);
      if (ownerId === req.user.id) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    } catch (error) {
      console.error('Owner/Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware factory for resource-level permissions
 * Checks if user has permission for specific action on resource
 */
const createResourcePermissionMiddleware = (resource) => {
  return (action) => {
    return requirePermission(`${resource}:${action}`);
  };
};

module.exports = {
  requirePermission,
  requireRole,
  requireOwnerOrPermission,
  createResourcePermissionMiddleware
};
