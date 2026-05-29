/**
 * Database seed script
 * Creates default permissions, roles, and users
 */

const { db, initializeSchema, closeConnection } = require('./connection');
const { User, Role, Permission } = require('../models');
const { permissions, defaultRoles } = require('../config/permissions');
const { hashPassword } = require('../middleware/auth');

async function seed() {
  console.log('Starting database seed...\n');

  // Initialize schema
  initializeSchema();

  // Clear existing data (optional - be careful in production!)
  console.log('Clearing existing data...');
  db.prepare('DELETE FROM role_permissions').run();
  db.prepare('DELETE FROM user_roles').run();
  db.prepare('DELETE FROM refresh_tokens').run();
  db.prepare('DELETE FROM audit_logs').run();
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM roles').run();
  db.prepare('DELETE FROM permissions').run();
  console.log('Existing data cleared.\n');

  // Create permissions
  console.log('Creating permissions...');
  const permissionMap = new Map();
  
  for (const [key, name] of Object.entries(permissions)) {
    const parts = name.split(':');
    const perm = Permission.create({
      name,
      resource: parts[0],
      action: parts[1],
      description: `${parts[0]} ${parts[1]} permission`
    });
    permissionMap.set(name, perm.id);
    console.log(`  Created permission: ${name}`);
  }
  console.log(`${permissionMap.size} permissions created.\n`);

  // Create roles
  console.log('Creating roles...');
  const roleMap = new Map();
  
  for (const [key, roleData] of Object.entries(defaultRoles)) {
    const role = Role.create({
      name: roleData.name,
      description: roleData.description,
      isSystem: roleData.isSystem,
      permissionIds: roleData.permissions.map(p => permissionMap.get(p))
    });
    roleMap.set(roleData.name, role.id);
    console.log(`  Created role: ${roleData.name}`);
  }
  console.log(`${roleMap.size} roles created.\n`);

  // Create default users
  console.log('Creating default users...');
  
  const defaultUsers = [
    {
      email: 'superadmin@example.com',
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Admin',
      roleName: 'Super Admin'
    },
    {
      email: 'admin@example.com',
      password: 'Admin123!',
      firstName: 'System',
      lastName: 'Administrator',
      roleName: 'Admin'
    },
    {
      email: 'editor@example.com',
      password: 'Editor123!',
      firstName: 'Content',
      lastName: 'Editor',
      roleName: 'Editor'
    },
    {
      email: 'viewer@example.com',
      password: 'Viewer123!',
      firstName: 'Read',
      lastName: 'Only',
      roleName: 'Viewer'
    }
  ];

  for (const userData of defaultUsers) {
    const hashedPassword = await hashPassword(userData.password);
    const user = User.create({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: true,
      roleIds: [roleMap.get(userData.roleName)]
    });
    console.log(`  Created user: ${userData.email} (${userData.roleName})`);
  }
  console.log(`${defaultUsers.length} users created.\n`);

  console.log('Seed completed successfully!');
  console.log('\nDefault credentials:');
  console.log('  Super Admin: superadmin@example.com / SuperAdmin123!');
  console.log('  Admin:       admin@example.com / Admin123!');
  console.log('  Editor:      editor@example.com / Editor123!');
  console.log('  Viewer:      viewer@example.com / Viewer123!');
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      closeConnection();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      closeConnection();
      process.exit(1);
    });
}

module.exports = { seed };
