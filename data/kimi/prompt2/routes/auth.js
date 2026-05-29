const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { userDb, tokenDb } = require('../database');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/emailService');
const { generateResetToken, isTokenExpired, isValidTokenFormat } = require('../services/tokenService');

const router = express.Router();

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Register endpoint (for testing purposes)
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await userDb.createUser(email, password);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { id: user.id, email: user.email }
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});

// Login endpoint (for testing purposes)
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await userDb.findByEmail(email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
});

// Forgot Password - Step 1: Request password reset
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email } = req.body;
    
    // Always return success even if email doesn't exist (security best practice)
    // This prevents email enumeration attacks
    
    const user = await userDb.findByEmail(email);
    
    if (user) {
      // Generate reset token
      const tokenData = generateResetToken(user.id);
      
      // Save token to database
      await tokenDb.createToken(user.id, tokenData.token, tokenData.expiresAt);
      
      // Send email
      await sendPasswordResetEmail(email, tokenData.token);
      
      console.log(`Password reset requested for: ${email}`);
    }
    
    // Return generic success message regardless of whether user exists
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return generic success message to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.'
    });
  }
});

// Verify Token - Check if reset token is valid
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Validate token format
    if (!isValidTokenFormat(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    // Find token in database
    const tokenRecord = await tokenDb.findByToken(token);
    
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Check if token is expired
    if (isTokenExpired(tokenRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Token has expired. Please request a new password reset.'
      });
    }
    
    // Token is valid
    res.json({
      success: true,
      message: 'Token is valid',
      data: { email: tokenRecord.email }
    });
    
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
});

// Reset Password - Step 2: Set new password
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid token format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Validate token format
    if (!isValidTokenFormat(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    // Find and validate token
    const tokenRecord = await tokenDb.findByToken(token);
    
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used token'
      });
    }
    
    // Check if token is expired
    if (isTokenExpired(tokenRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Token has expired. Please request a new password reset.'
      });
    }
    
    // Update user password
    await userDb.updatePassword(tokenRecord.user_id, password);
    
    // Mark token as used
    await tokenDb.markAsUsed(tokenRecord.id);
    
    // Invalidate any other tokens for this user
    await tokenDb.invalidateUserTokens(tokenRecord.user_id);
    
    // Send confirmation email
    await sendPasswordChangedEmail(tokenRecord.email);
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Cleanup expired tokens (can be called periodically or via cron job)
router.delete('/cleanup-tokens', async (req, res) => {
  try {
    // In production, add authentication here
    const result = await tokenDb.deleteExpiredTokens();
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deleted} expired tokens`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup tokens'
    });
  }
});

// ==================== DEBUG ENDPOINTS (Development Only) ====================
// These endpoints are for testing purposes only and should be disabled in production

// Get all users (debug)
router.get('/debug/users', async (req, res) => {
  try {
    const { getAllUsers } = require('../database');
    const users = await getAllUsers();
    
    // Don't return password hashes
    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));
    
    res.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// Get all tokens (debug)
router.get('/debug/tokens', async (req, res) => {
  try {
    const { getAllTokens } = require('../database');
    const tokens = await getAllTokens();
    res.json({ success: true, tokens });
  } catch (error) {
    console.error('Debug tokens error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tokens' });
  }
});

// Direct password reset (debug - bypass token)
router.post('/debug/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    const user = await userDb.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await userDb.updatePassword(userId, newPassword);
    await tokenDb.invalidateUserTokens(userId);
    
    res.json({
      success: true,
      message: `Password updated for user ${user.email}`
    });
  } catch (error) {
    console.error('Debug reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Clear all data (debug)
router.delete('/debug/clear-all', async (req, res) => {
  try {
    const { clearAllData } = require('../database');
    await clearAllData();
    res.json({ success: true, message: 'All data cleared successfully' });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear data' });
  }
});

module.exports = router;
