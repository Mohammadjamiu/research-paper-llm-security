const fs = require('fs');
const path = require('path');
const { dbFile } = require('./config');
const { conflict, badRequest, notFound } = require('./errors');
const { hashPassword } = require('./security/password');
const { normalizeEmail, slugify, normalizePermissionKey } = require('./utils/strings');

let cache = null;

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStorage() {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
}

function permissionTemplate(key, description, id) {
  return {
    id,
    key,
    description,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function roleTemplate(id, name, slug, description, system) {
  return {
    id,
    name,
    slug,
    description,
    system,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function defaultDb() {
  const permissions = [
    permissionTemplate('dashboard.view', 'View the dashboard', 1),
    permissionTemplate('users.read', 'Read users', 2),
    permissionTemplate('users.create', 'Create users', 3),
    permissionTemplate('users.update', 'Update users', 4),
    permissionTemplate('users.delete', 'Delete users', 5),
    permissionTemplate('roles.read', 'Read roles', 6),
    permissionTemplate('roles.create', 'Create roles', 7),
    permissionTemplate('roles.update', 'Update roles', 8),
    permissionTemplate('roles.delete', 'Delete roles', 9),
    permissionTemplate('permissions.read', 'Read permissions', 10),
    permissionTemplate('permissions.create', 'Create permissions', 11),
    permissionTemplate('permissions.update', 'Update permissions', 12),
    permissionTemplate('permissions.delete', 'Delete permissions', 13),
    permissionTemplate('audit.read', 'Read audit logs', 14),
  ];

  const roles = [
    roleTemplate(1, 'Super Admin', 'super_admin', 'Full access to everything', true),
    roleTemplate(2, 'Admin', 'admin', 'Administrative access', true),
    roleTemplate(3, 'Manager', 'manager', 'Manage users and inspect the dashboard', true),
    roleTemplate(4, 'Viewer', 'viewer', 'Read-only access', true),
  ];

  const permissionId = (key) => permissions.find((permission) => permission.key === key)?.id;

  const rolePermissions = [
    ...permissions.map((permission) => ({ roleId: 2, permissionId: permission.id })),
    { roleId: 3, permissionId: permissionId('dashboard.view') },
    { roleId: 3, permissionId: permissionId('users.read') },
    { roleId: 3, permissionId: permissionId('users.update') },
    { roleId: 3, permissionId: permissionId('audit.read') },
    { roleId: 4, permissionId: permissionId('dashboard.view') },
  ].filter((entry) => entry.permissionId);

  const adminPassword = hashPassword('Admin123!');
  const managerPassword = hashPassword('Manager123!');
  const viewerPassword = hashPassword('Viewer123!');

  const users = [
    {
      id: 1,
      name: 'System Admin',
      email: 'admin@local.test',
      passwordHash: adminPassword.hash,
      passwordSalt: adminPassword.salt,
      roleId: 1,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 2,
      name: 'Demo Manager',
      email: 'manager@local.test',
      passwordHash: managerPassword.hash,
      passwordSalt: managerPassword.salt,
      roleId: 3,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 3,
      name: 'Demo Viewer',
      email: 'viewer@local.test',
      passwordHash: viewerPassword.hash,
      passwordSalt: viewerPassword.salt,
      roleId: 4,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  return {
    users,
    roles,
    permissions,
    rolePermissions,
    auditLogs: [],
  };
}

function normalizeDb(db) {
  const normalized = db && typeof db === 'object' ? db : {};
  normalized.users = Array.isArray(normalized.users) ? normalized.users : [];
  normalized.roles = Array.isArray(normalized.roles) ? normalized.roles : [];
  normalized.permissions = Array.isArray(normalized.permissions) ? normalized.permissions : [];
  normalized.rolePermissions = Array.isArray(normalized.rolePermissions) ? normalized.rolePermissions : [];
  normalized.auditLogs = Array.isArray(normalized.auditLogs) ? normalized.auditLogs : [];
  return normalized;
}

function loadDb() {
  if (cache) {
    return cache;
  }

  ensureStorage();

  if (!fs.existsSync(dbFile)) {
    cache = defaultDb();
    saveDb();
    return cache;
  }

  const raw = fs.readFileSync(dbFile, 'utf8');
  cache = normalizeDb(JSON.parse(raw));
  return cache;
}

function saveDb() {
  ensureStorage();
  fs.writeFileSync(dbFile, JSON.stringify(cache, null, 2), 'utf8');
}

function db() {
  return loadDb();
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function findUserById(id) {
  return db().users.find((user) => user.id === Number(id)) || null;
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return db().users.find((user) => user.email === normalizedEmail) || null;
}

function getRoleById(id) {
  return db().roles.find((role) => role.id === Number(id)) || null;
}

function findRoleBySlug(slug) {
  return db().roles.find((role) => role.slug === slug) || null;
}

function getPermissionById(id) {
  return db().permissions.find((permission) => permission.id === Number(id)) || null;
}

function findPermissionByKey(key) {
  const normalizedKey = normalizePermissionKey(key);
  return db().permissions.find((permission) => permission.key === normalizedKey) || null;
}

function getPermissionKeysForRole(roleId) {
  const role = getRoleById(roleId);
  if (!role) {
    return [];
  }

  if (role.slug === 'super_admin') {
    return db().permissions.map((permission) => permission.key);
  }

  const permissionIds = new Set(db().rolePermissions.filter((item) => item.roleId === role.id).map((item) => item.permissionId));
  return db().permissions.filter((permission) => permissionIds.has(permission.id)).map((permission) => permission.key);
}

function countUsersWithRoleSlug(slug) {
  return db().users.filter((user) => getRoleById(user.roleId)?.slug === slug).length;
}

function publicPermission(permission) {
  if (!permission) {
    return null;
  }

  return {
    id: permission.id,
    key: permission.key,
    description: permission.description,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  };
}

function publicRole(role) {
  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    system: Boolean(role.system),
    permissions: getPermissionKeysForRole(role.id),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

function publicUser(user) {
  if (!user) {
    return null;
  }

  const role = getRoleById(user.roleId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    role: publicRole(role),
    permissions: role ? getPermissionKeysForRole(role.id) : [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function publicAuditLog(entry) {
  const actor = entry.actorUserId ? findUserById(entry.actorUserId) : null;
  return {
    id: entry.id,
    actorUserId: entry.actorUserId,
    actorEmail: actor ? actor.email : null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
  };
}

function listUsers() {
  return db().users.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicUser);
}

function listRoles() {
  return db().roles.slice().sort((a, b) => a.id - b.id).map(publicRole);
}

function listPermissions() {
  return db().permissions.slice().sort((a, b) => a.id - b.id).map(publicPermission);
}

function listAuditLogs() {
  return db().auditLogs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicAuditLog);
}

function validateRolePermissions(permissionKeys) {
  if (!Array.isArray(permissionKeys)) {
    throw badRequest('permissionKeys must be an array');
  }

  const normalized = [...new Set(permissionKeys.map(normalizePermissionKey).filter(Boolean))];
  const invalid = normalized.filter((key) => !findPermissionByKey(key));
  if (invalid.length > 0) {
    throw badRequest('Unknown permission keys', { invalid });
  }

  return normalized;
}

function applyRolePermissions(roleId, permissionKeys) {
  const permissions = validateRolePermissions(permissionKeys);
  const role = getRoleById(roleId);

  if (!role) {
    throw notFound('Role not found');
  }

  if (role.slug === 'super_admin') {
    throw conflict('Super admin permissions are implicit and cannot be edited');
  }

  const permissionIds = permissions.map((key) => findPermissionByKey(key).id);
  cache.rolePermissions = cache.rolePermissions.filter((item) => item.roleId !== roleId);
  for (const permissionId of permissionIds) {
    cache.rolePermissions.push({ roleId, permissionId });
  }
  role.updatedAt = nowIso();
  saveDb();
  return publicRole(role);
}

function createUser({ name, email, password, roleId, status = 'active' }) {
  const normalizedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const role = getRoleById(roleId);

  if (!normalizedName) {
    throw badRequest('User name is required');
  }

  if (!normalizedEmail) {
    throw badRequest('User email is required');
  }

  if (!password) {
    throw badRequest('Password is required');
  }

  if (findUserByEmail(normalizedEmail)) {
    throw conflict('Email already exists');
  }

  if (!role) {
    throw badRequest('Role not found');
  }

  const hashed = hashPassword(password);
  const user = {
    id: nextId(db().users),
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: hashed.hash,
    passwordSalt: hashed.salt,
    roleId: role.id,
    status: status === 'inactive' ? 'inactive' : 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db().users.push(user);
  saveDb();
  return publicUser(user);
}

function updateUser(id, patch) {
  const user = findUserById(id);
  if (!user) {
    throw notFound('User not found');
  }

  if (patch.email) {
    const normalizedEmail = normalizeEmail(patch.email);
    const conflictUser = findUserByEmail(normalizedEmail);
    if (conflictUser && conflictUser.id !== user.id) {
      throw conflict('Email already exists');
    }
    user.email = normalizedEmail;
  }

  if (typeof patch.name === 'string' && patch.name.trim()) {
    user.name = patch.name.trim();
  }

  if (typeof patch.password === 'string' && patch.password.length > 0) {
    const hashed = hashPassword(patch.password);
    user.passwordHash = hashed.hash;
    user.passwordSalt = hashed.salt;
  }

  if (typeof patch.status === 'string') {
    user.status = patch.status === 'inactive' ? 'inactive' : 'active';
  }

  if (patch.roleId !== undefined) {
    const role = getRoleById(patch.roleId);
    if (!role) {
      throw badRequest('Role not found');
    }

    const currentRole = getRoleById(user.roleId);
    if (currentRole?.slug === 'super_admin' && role.slug !== 'super_admin' && countUsersWithRoleSlug('super_admin') <= 1) {
      throw conflict('Cannot remove the last super admin');
    }

    user.roleId = role.id;
  }

  user.updatedAt = nowIso();
  saveDb();
  return publicUser(user);
}

function deleteUser(id, actorUserId) {
  const user = findUserById(id);
  if (!user) {
    throw notFound('User not found');
  }

  const role = getRoleById(user.roleId);
  if (role?.slug === 'super_admin' && countUsersWithRoleSlug('super_admin') <= 1) {
    throw conflict('Cannot delete the last super admin');
  }

  if (actorUserId && Number(actorUserId) === Number(user.id)) {
    throw conflict('You cannot delete your own account');
  }

  db().users = db().users.filter((item) => item.id !== Number(id));
  saveDb();
  return publicUser(user);
}

function createRole({ name, description = '', permissionKeys = [], system = false }) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    throw badRequest('Role name is required');
  }

  const slug = slugify(normalizedName);
  if (!slug) {
    throw badRequest('Role name must contain letters or numbers');
  }

  if (db().roles.some((role) => role.slug === slug)) {
    throw conflict('Role already exists');
  }

  const role = {
    id: nextId(db().roles),
    name: normalizedName,
    slug,
    description: String(description || ''),
    system: Boolean(system),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db().roles.push(role);
  saveDb();

  if (Array.isArray(permissionKeys) && permissionKeys.length > 0) {
    applyRolePermissions(role.id, permissionKeys);
    return publicRole(getRoleById(role.id));
  }

  return publicRole(role);
}

function updateRole(id, patch) {
  const role = getRoleById(id);
  if (!role) {
    throw notFound('Role not found');
  }

  if (typeof patch.name === 'string' && patch.name.trim()) {
    const newName = patch.name.trim();
    const newSlug = slugify(newName);
    const existing = db().roles.find((item) => item.slug === newSlug && item.id !== role.id);
    if (existing) {
      throw conflict('Role already exists');
    }
    role.name = newName;
    role.slug = newSlug;
  }

  if (typeof patch.description === 'string') {
    role.description = patch.description;
  }

  if (Array.isArray(patch.permissionKeys)) {
    if (role.slug === 'super_admin') {
      throw conflict('Super admin permissions are implicit and cannot be edited');
    }
    applyRolePermissions(role.id, patch.permissionKeys);
  }

  role.updatedAt = nowIso();
  saveDb();
  return publicRole(role);
}

function deleteRole(id) {
  const role = getRoleById(id);
  if (!role) {
    throw notFound('Role not found');
  }

  if (role.system) {
    throw conflict('System roles cannot be deleted');
  }

  if (db().users.some((user) => user.roleId === role.id)) {
    throw conflict('Role is assigned to users');
  }

  db().roles = db().roles.filter((item) => item.id !== Number(id));
  db().rolePermissions = db().rolePermissions.filter((item) => item.roleId !== Number(id));
  saveDb();
  return publicRole(role);
}

function createPermission({ key, description = '' }) {
  const normalizedKey = normalizePermissionKey(key);
  if (!normalizedKey) {
    throw badRequest('Permission key is required');
  }

  if (!/^[a-z0-9][a-z0-9._:-]*$/.test(normalizedKey)) {
    throw badRequest('Permission key contains invalid characters');
  }

  if (findPermissionByKey(normalizedKey)) {
    throw conflict('Permission already exists');
  }

  const permission = {
    id: nextId(db().permissions),
    key: normalizedKey,
    description: String(description || ''),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db().permissions.push(permission);
  saveDb();
  return publicPermission(permission);
}

function updatePermission(id, patch) {
  const permission = getPermissionById(id);
  if (!permission) {
    throw notFound('Permission not found');
  }

  if (typeof patch.key === 'string' && patch.key.trim()) {
    const normalizedKey = normalizePermissionKey(patch.key);
    if (!/^[a-z0-9][a-z0-9._:-]*$/.test(normalizedKey)) {
      throw badRequest('Permission key contains invalid characters');
    }
    const existing = findPermissionByKey(normalizedKey);
    if (existing && existing.id !== permission.id) {
      throw conflict('Permission already exists');
    }
    permission.key = normalizedKey;
  }

  if (typeof patch.description === 'string') {
    permission.description = patch.description;
  }

  permission.updatedAt = nowIso();
  saveDb();
  return publicPermission(permission);
}

function deletePermission(id) {
  const permission = getPermissionById(id);
  if (!permission) {
    throw notFound('Permission not found');
  }

  db().permissions = db().permissions.filter((item) => item.id !== Number(id));
  db().rolePermissions = db().rolePermissions.filter((item) => item.permissionId !== Number(id));
  saveDb();
  return publicPermission(permission);
}

function createAuditLog({ actorUserId = null, action, entityType, entityId = null, metadata = {} }) {
  const log = {
    id: nextId(db().auditLogs),
    actorUserId: actorUserId ? Number(actorUserId) : null,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: nowIso(),
  };

  db().auditLogs.push(log);
  saveDb();
  return publicAuditLog(log);
}

function getDashboardStats() {
  const users = db().users;
  const roles = db().roles;
  const permissions = db().permissions;

  return {
    users: users.length,
    activeUsers: users.filter((user) => user.status === 'active').length,
    roles: roles.length,
    permissions: permissions.length,
    auditLogs: db().auditLogs.length,
    recentAuditLogs: db().auditLogs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(publicAuditLog),
  };
}

module.exports = {
  loadDb,
  findUserById,
  findUserByEmail,
  getRoleById,
  findRoleBySlug,
  getPermissionById,
  findPermissionByKey,
  getPermissionKeysForRole,
  publicUser,
  publicRole,
  publicPermission,
  publicAuditLog,
  listUsers,
  listRoles,
  listPermissions,
  listAuditLogs,
  createUser,
  updateUser,
  deleteUser,
  createRole,
  updateRole,
  deleteRole,
  applyRolePermissions,
  createPermission,
  updatePermission,
  deletePermission,
  createAuditLog,
  getDashboardStats,
};
