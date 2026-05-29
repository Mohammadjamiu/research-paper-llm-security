const express = require('express');
const router = express.Router();

const { RoleController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { validate } = require('../utils/helpers');
const { roleSchemas } = require('../utils/validation');
const { auditLog, auditActions } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);

// List roles - requires roles:read permission
router.get('/',
  requirePermission('roles:read'),
  RoleController.list
);

// Get role stats - requires roles:read permission
router.get('/stats',
  requirePermission('roles:read'),
  RoleController.getStats
);

// Get role by ID - requires roles:read permission
router.get('/:id',
  requirePermission('roles:read'),
  validate(roleSchemas.update), // Reuse params validation
  RoleController.getById
);

// Create role - requires roles:write permission
router.post('/',
  requirePermission('roles:write'),
  validate(roleSchemas.create),
  auditLog(auditActions.ROLE_CREATE),
  RoleController.create
);

// Update role - requires roles:write permission
router.put('/:id',
  requirePermission('roles:write'),
  validate(roleSchemas.update),
  auditLog(auditActions.ROLE_UPDATE),
  RoleController.update
);

// Delete role - requires roles:delete permission
router.delete('/:id',
  requirePermission('roles:delete'),
  validate(roleSchemas.update), // Reuse params validation
  auditLog(auditActions.ROLE_DELETE),
  RoleController.delete
);

// Assign permissions to role - requires roles:write permission
router.put('/:id/permissions',
  requirePermission('roles:write'),
  auditLog(auditActions.ROLE_PERMISSION_ASSIGN),
  RoleController.assignPermissions
);

module.exports = router;
