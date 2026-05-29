import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { hasRole, hasPermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', hasPermission('users:read'), (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_active, u.created_at, u.updated_at,
           r.name as role, r.permissions
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM users').get();

  res.json({
    users,
    pagination: {
      page,
      limit,
      total: total.count,
      totalPages: Math.ceil(total.count / limit),
    },
  });
});

router.get('/:id', hasPermission('users:read'), (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_active, u.created_at, u.updated_at,
           r.name as role, r.permissions
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

router.post('/', hasPermission('users:write'), (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Username, email, password, and role are required.' });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'Username or email already exists.' });
  }

  const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(role);
  if (!roleRow) {
    return res.status(400).json({ error: `Role '${role}' does not exist.` });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)'
  ).run(username, email, passwordHash, roleRow.id);

  const newUser = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_active, u.created_at, r.name as role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ user: newUser });
});

router.put('/:id', hasPermission('users:write'), (req, res) => {
  const { username, email, password, role, is_active } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (role) {
    const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(role);
    if (!roleRow) {
      return res.status(400).json({ error: `Role '${role}' does not exist.` });
    }
  }

  const updates = [];
  const params = [];

  if (username) { updates.push('username = ?'); params.push(username); }
  if (email) { updates.push('email = ?'); params.push(email); }
  if (password) {
    updates.push('password_hash = ?');
    params.push(bcrypt.hashSync(password, 10));
  }
  if (role) {
    const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(role);
    updates.push('role_id = ?');
    params.push(roleRow.id);
  }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updatedUser = db.prepare(`
    SELECT u.id, u.username, u.email, u.is_active, u.created_at, u.updated_at, r.name as role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(req.params.id);

  res.json({ user: updatedUser });
});

router.delete('/:id', hasPermission('users:delete'), (req, res) => {
  const db = getDb();

  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({ message: `User '${user.username}' deleted.` });
});

export default router;
