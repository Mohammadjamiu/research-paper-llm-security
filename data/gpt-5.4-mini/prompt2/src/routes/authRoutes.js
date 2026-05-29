const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/forgot-password', authController.requestPasswordReset);
router.get('/forgot-password/verify', authController.verifyPasswordResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
