const express = require('express');
const User = require('../models/user');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', verifyToken, (req, res) => {
  try {
    const user = User.getById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: 'Error retrieving profile',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/user/all
 * @desc    Get all users (protected route example)
 * @access  Private
 */
router.get('/all', verifyToken, (req, res) => {
  try {
    const users = User.getAll();
    
    res.json({
      message: 'Users retrieved successfully',
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Error retrieving users',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/user/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', verifyToken, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID' 
      });
    }

    const user = User.getById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Error retrieving user',
      error: error.message 
    });
  }
});

module.exports = router;
