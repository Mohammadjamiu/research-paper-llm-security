const express = require('express');
const router = express.Router();

const { PermissionController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticate);

// List permissions - requires permissions:read
router.get('/',
  requirePermission('permissions:read'),
  PermissionController.list
);

// Get permission resources - requires permissions:read
router.get('/resources',
  requirePermission('permissions:read'),
  PermissionController.getResources
);

// Get permissions by resource - requires permissions:read
router.get('/resource/:resource',
  requirePermission('permissions:read'),
  PermissionController.getByResource
);

// Get permission by ID - requires permissions:read
router.get('/:id',
  requirePermission('permissions:read'),
  PermissionController.getById
);

// Create permission - requires permissions:write
router.post('/',
  requirePermission('permissions:write'),
  PermissionController.create
);

// Update permission - requires permissions:write
router.put('/:id',
  requirePermission('permissions:write'),
  PermissionController.update
);

// Delete permission - requires permissions:write
router.delete('/:id',
  requirePermission('permissions:write'),
  PermissionController.delete
);

module.exports = router;
