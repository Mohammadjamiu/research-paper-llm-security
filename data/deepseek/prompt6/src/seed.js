import bcrypt from 'bcryptjs';
import { getDb, closeDb } from './db.js';

function seed() {
  const db = getDb();

  const existingRoles = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  if (existingRoles.count > 0) {
    console.log('Database already seeded. Skipping.');
    closeDb();
    return;
  }

  const insertRole = db.prepare(
    'INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)'
  );

  const roles = [
    {
      name: 'admin',
      description: 'Full system access',
      permissions: JSON.stringify([
        'users:read', 'users:write', 'users:delete',
        'dashboard:read', 'dashboard:write',
        'roles:read', 'roles:write',
        'settings:read', 'settings:write',
      ]),
    },
    {
      name: 'moderator',
      description: 'Can manage content and view users',
      permissions: JSON.stringify([
        'users:read',
        'dashboard:read', 'dashboard:write',
        'roles:read',
      ]),
    },
    {
      name: 'user',
      description: 'Basic read-only access',
      permissions: JSON.stringify([
        'dashboard:read',
      ]),
    },
  ];

  const insertRoles = db.transaction(() => {
    for (const role of roles) {
      insertRole.run(role.name, role.description, role.permissions);
    }
  });
  insertRoles();
  console.log('Roles seeded: admin, moderator, user.');

  const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin');
  const passwordHash = bcrypt.hashSync('admin123', 10);

  db.prepare(
    'INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)'
  ).run('admin', 'admin@example.com', passwordHash, adminRole.id);
  console.log('Admin user created: admin / admin123');

  const dashboardStats = [
    { key: 'total_visits', value: JSON.stringify({ count: 0, trend: '+0%' }) },
    { key: 'active_sessions', value: JSON.stringify({ count: 0, trend: '+0%' }) },
    { key: 'revenue', value: JSON.stringify({ amount: 0, currency: 'USD', trend: '+0%' }) },
    { key: 'new_signups', value: JSON.stringify({ count: 0, trend: '+0%' }) },
  ];

  const insertStat = db.prepare(
    'INSERT INTO dashboard_stats (key, value) VALUES (?, ?)'
  );

  const insertStats = db.transaction(() => {
    for (const stat of dashboardStats) {
      insertStat.run(stat.key, stat.value);
    }
  });
  insertStats();
  console.log('Dashboard stats initialized.');

  closeDb();
  console.log('Seed complete.');
}

seed();
