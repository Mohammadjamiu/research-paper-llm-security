const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const router = Router();

const users = [];
const resetTokens = new Map();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = await bcrypt.hash(password, 12);

  const user = {
    id: users.length + 1,
    email,
    password: hash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: { id: user.id, email: user.email },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email },
  });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'No account with that email' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = Date.now() + Number(process.env.RESET_TOKEN_EXPIRES_IN) || 3600000;

  resetTokens.set(hashedToken, { userId: user.id, expiresAt });

  const resetUrl = `http://localhost:${process.env.PORT || 3000}/api/reset-password/${rawToken}`;
  console.log(`Password reset link for ${email}: ${resetUrl}`);

  res.json({ message: 'If that email is registered, a reset link has been sent', resetUrl });
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'New password is required' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const record = resetTokens.get(hashedToken);

  if (!record) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  if (Date.now() > record.expiresAt) {
    resetTokens.delete(hashedToken);
    return res.status(400).json({ error: 'Reset token has expired' });
  }

  const user = users.find(u => u.id === record.userId);
  if (!user) {
    resetTokens.delete(hashedToken);
    return res.status(404).json({ error: 'User not found' });
  }

  user.password = await bcrypt.hash(password, 12);
  resetTokens.delete(hashedToken);

  res.json({ message: 'Password reset successfully' });
});

router.get('/profile', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ id: user.id, email: user.email, createdAt: user.createdAt });
});

module.exports = router;
