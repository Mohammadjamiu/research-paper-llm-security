const express = require('express');
const router = express.Router();

const { AuthController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/helpers');
const { authSchemas } = require('../utils/validation');
const { auditLog, auditActions } = require('../middleware/audit');

// Public routes
router.post('/register', 
  validate(authSchemas.register),
  auditLog(auditActions.REGISTER),
  AuthController.register
);

router.post('/login', 
  validate(authSchemas.login),
  auditLog(auditActions.LOGIN),
  AuthController.login
);

router.post('/refresh', 
  validate(authSchemas.refreshToken),
  AuthController.refreshToken
);

// Protected routes
router.use(authenticate);

router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAll);

router.post('/change-password', 
  validate(authSchemas.changePassword),
  auditLog(auditActions.PASSWORD_CHANGE),
  AuthController.changePassword
);

router.get('/me', AuthController.getCurrentUser);

module.exports = router;
