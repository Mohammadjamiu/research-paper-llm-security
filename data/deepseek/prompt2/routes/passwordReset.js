const express = require('express');
const User = require('../models/User');
const { createResetToken, verifyResetToken, markTokenUsed, cleanupExpiredTokens } = require('../utils/token');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null, success: null });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.render('forgot-password', { error: 'Email is required', success: null });
    }

    const user = User.findByEmail(email);

    if (!user) {
      return res.render('forgot-password', {
        success: 'If that email is registered, you will receive a password reset link.',
        error: null,
      });
    }

    cleanupExpiredTokens();

    const token = createResetToken(user.id, parseInt(process.env.TOKEN_EXPIRY_MINUTES, 10) || 60);

    await sendPasswordResetEmail({
      to: user.email,
      token,
      baseUrl: getBaseUrl(req),
    });

    res.render('forgot-password', {
      success: 'If that email is registered, you will receive a password reset link.',
      error: null,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('forgot-password', { error: 'Something went wrong. Please try again.', success: null });
  }
});

router.get('/reset-password', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Missing reset token.');
  }

  const record = verifyResetToken(token);

  if (!record) {
    return res.status(400).send('Invalid or expired reset token.');
  }

  res.render('reset-password', { token, error: null });
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.render('reset-password', { token, error: 'All fields are required.' });
    }

    if (password.length < 8) {
      return res.render('reset-password', { token, error: 'Password must be at least 8 characters.' });
    }

    if (password !== confirmPassword) {
      return res.render('reset-password', { token, error: 'Passwords do not match.' });
    }

    const record = verifyResetToken(token);

    if (!record) {
      return res.status(400).send('Invalid or expired reset token.');
    }

    await User.updatePassword(record.user_id, password);
    markTokenUsed(token);

    res.send(`
      <h2>Password Reset Successful</h2>
      <p>Your password has been reset. You can now log in with your new password.</p>
      <p><a href="/login">Go to Login</a></p>
    `);
  } catch (err) {
    console.error('Reset password error:', err);
    res.render('reset-password', { token, error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
