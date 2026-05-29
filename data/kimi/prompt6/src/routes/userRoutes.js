const express = require('express');
const router = express.Router();

const { UserController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { validate } = require('../utils/helpers');
const { userSchemas } = require('../utils/validation');
const { auditLog, auditActions } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);

// List users - requires users:read permission
router.get('/',
  requirePermission('users:read'),
  validate(userSchemas.list),
  UserController.list
);

// Get user stats - requires users:read permission
router.get('/stats',
  requirePermission('users:read'),
  UserController.getStats
);

// Get user by ID - requires users:read permission
router.get('/:id',
  requirePermission('users:read'),
  validate(userSchemas.update), // Reuse params validation
  UserController.getById
);

// Create user - requires users:write permission
router.post('/',
  requirePermission('users:write'),
  validate(userSchemas.create),
  auditLog(auditActions.USER_CREATE),
  UserController.create
);

// Update user - requires users:write permission
router.put('/:id',
  requirePermission('users:write'),
  validate(userSchemas.update),
  auditLog(auditActions.USER_UPDATE),
  UserController.update
);

// Delete user - requires users:delete permission
router.delete('/:id',
  requirePermission('users:delete'),
  validate(userSchemas.update), // Reuse params validation
  auditLog(auditActions.USER_DELETE),
  UserController.delete
);

// Assign roles to user - requires roles:write permission
router.put('/:id/roles',
  requirePermission('roles:write'),
  validate(userSchemas.assignRoles),
  auditLog(auditActions.USER_ROLE_ASSIGN),
  UserController.assignRoles
);

module.exports = router;
