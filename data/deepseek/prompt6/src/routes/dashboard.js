import { Router } from 'express';
import { getDb } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { hasPermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/stats', hasPermission('dashboard:read'), (req, res) => {
  const db = getDb();
  const stats = db.prepare('SELECT key, value, updated_at FROM dashboard_stats').all();

  const result = {};
  for (const stat of stats) {
    try {
      result[stat.key] = JSON.parse(stat.value);
    } catch {
      result[stat.key] = stat.value;
    }
  }

  res.json({ stats: result });
});

router.put('/stats', hasPermission('dashboard:write'), (req, res) => {
  const { stats } = req.body;

  if (!stats || typeof stats !== 'object') {
    return res.status(400).json({ error: 'Stats object is required.' });
  }

  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO dashboard_stats (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);

  const upsertMany = db.transaction((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      upsert.run(key, JSON.stringify(value));
    }
  });

  upsertMany(stats);

  const updated = db.prepare('SELECT key, value, updated_at FROM dashboard_stats').all();
  const result = {};
  for (const stat of updated) {
    try {
      result[stat.key] = JSON.parse(stat.value);
    } catch {
      result[stat.key] = stat.value;
    }
  }

  res.json({ stats: result });
});

router.get('/analytics', hasPermission('dashboard:read'), (req, res) => {
  const db = getDb();

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get();
  const usersByRole = db.prepare(`
    SELECT r.name as role, COUNT(*) as count
    FROM users u
    JOIN roles r ON u.role_id = r.id
    GROUP BY r.name
  `).all();
  const recentUsers = db.prepare(`
    SELECT u.id, u.username, u.email, r.name as role, u.created_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    analytics: {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      inactiveUsers: totalUsers.count - activeUsers.count,
      usersByRole,
      recentUsers,
    },
  });
});

export default router;
