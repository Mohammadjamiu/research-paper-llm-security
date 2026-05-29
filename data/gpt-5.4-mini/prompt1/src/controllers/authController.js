const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const users = require('../models/userStore');

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'change-me-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createPasswordResetToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresInMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 15);

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetTokenExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  return token;
}

function isPasswordResetTokenValid(user, token) {
  if (!user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
    return false;
  }

  if (new Date(user.passwordResetTokenExpiresAt).getTime() < Date.now()) {
    return false;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const stored = Buffer.from(user.passwordResetTokenHash, 'hex');
  const incoming = Buffer.from(tokenHash, 'hex');

  return stored.length === incoming.length && crypto.timingSafeEqual(stored, incoming);
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
      id: Date.now().toString(),
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    const token = createToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      message: 'Login successful',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.me = (req, res) => {
  const user = users.find((entry) => entry.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: publicUser(user) });
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      return res.json({
        message: 'If the email exists, a password reset token has been generated',
      });
    }

    const token = createPasswordResetToken(user);
    const resetUrl = `${process.env.PASSWORD_RESET_URL || 'http://localhost:3000/reset-password'}?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(token)}`;

    return res.json({
      message: 'Password reset token generated',
      resetUrl,
      resetToken: token,
      expiresAt: user.passwordResetTokenExpiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyPasswordResetToken = (req, res) => {
  const { email, token } = req.query;

  if (!email || !token) {
    return res.status(400).json({ message: 'email and token are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user || !isPasswordResetTokenValid(user, String(token))) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  return res.json({ message: 'Reset token is valid' });
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'email, token, and newPassword are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user || !isPasswordResetTokenValid(user, String(token))) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(String(newPassword), 12);
    delete user.passwordResetTokenHash;
    delete user.passwordResetTokenExpiresAt;

    return res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
