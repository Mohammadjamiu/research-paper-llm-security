import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { JWT_SECRET, JWT_EXPIRES_IN, authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = getDb();

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    return res.status(409).json({ error: 'Username or email already exists.' });
  }

  const defaultRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('user');
  if (!defaultRole) {
    return res.status(500).json({ error: 'Default role not found. Please seed the database.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)'
  ).run(username, email, passwordHash, defaultRole.id);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username, email, role: 'user' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(201).json({
    message: 'User registered successfully.',
    token,
    user: { id: result.lastInsertRowid, username, email, role: 'user' },
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const db = getDb();

  const user = db.prepare(`
    SELECT u.id, u.username, u.email, u.password_hash, u.is_active, r.name as role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.username = ?
  `).get(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account is deactivated.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_active, u.created_at, r.name as role, r.permissions
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

export default router;
