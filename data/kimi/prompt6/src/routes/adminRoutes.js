const express = require('express');
const router = express.Router();

const { AdminController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { validate } = require('../utils/helpers');
const { auditLogSchemas } = require('../utils/validation');

// All routes require authentication and system:admin permission
router.use(authenticate);
router.use(requirePermission('system:admin'));

// Get dashboard statistics
router.get('/stats', AdminController.getDashboardStats);

// Get system health
router.get('/health', AdminController.getSystemHealth);

// Get audit logs
router.get('/audit-logs',
  validate(auditLogSchemas.list),
  AdminController.getAuditLogs
);

// Get audit log by ID
router.get('/audit-logs/:id', AdminController.getAuditLogById);

// Get audit statistics
router.get('/audit-stats', AdminController.getAuditStats);

module.exports = router;
