const { badRequest } = require('../errors');
const { readJsonBody, created, ok } = require('../utils/http');
const store = require('../store');

function parseLimitOffset(query) {
  const limit = Number.parseInt(query.limit || '100', 10);
  const offset = Number.parseInt(query.offset || '0', 10);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 100,
    offset: Number.isFinite(offset) && offset >= 0 ? offset : 0,
  };
}

async function stats(req, res) {
  ok(res, store.getDashboardStats());
}

async function listUsers(req, res) {
  ok(res, { users: store.listUsers() });
}

async function createUser(req, res) {
  const body = await readJsonBody(req);
  const user = store.createUser({
    name: body.name,
    email: body.email,
    password: body.password,
    roleId: body.roleId,
    status: body.status || 'active',
  });

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'user.create',
    entityType: 'user',
    entityId: user.id,
    metadata: { email: user.email, roleId: body.roleId },
  });

  created(res, { user });
}

async function updateUser(req, res) {
  const body = await readJsonBody(req);
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    throw badRequest('Invalid user id');
  }

  const updated = store.updateUser(userId, body);

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'user.update',
    entityType: 'user',
    entityId: updated.id,
    metadata: body,
  });

  ok(res, { user: updated });
}

async function deleteUser(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    throw badRequest('Invalid user id');
  }

  const removed = store.deleteUser(userId, req.user.id);

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'user.delete',
    entityType: 'user',
    entityId: removed.id,
    metadata: { email: removed.email },
  });

  ok(res, { user: removed });
}

async function listRoles(req, res) {
  ok(res, { roles: store.listRoles() });
}

async function createRole(req, res) {
  const body = await readJsonBody(req);
  const role = store.createRole({
    name: body.name,
    description: body.description,
    permissionKeys: body.permissionKeys || [],
    system: Boolean(body.system),
  });

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'role.create',
    entityType: 'role',
    entityId: role.id,
    metadata: { name: role.name },
  });

  created(res, { role });
}

async function updateRole(req, res) {
  const body = await readJsonBody(req);
  const roleId = Number(req.params.id);
  if (!Number.isFinite(roleId)) {
    throw badRequest('Invalid role id');
  }

  const role = store.updateRole(roleId, body);

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'role.update',
    entityType: 'role',
    entityId: role.id,
    metadata: body,
  });

  ok(res, { role });
}

async function deleteRole(req, res) {
  const roleId = Number(req.params.id);
  if (!Number.isFinite(roleId)) {
    throw badRequest('Invalid role id');
  }

  const role = store.deleteRole(roleId);

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'role.delete',
    entityType: 'role',
    entityId: role.id,
    metadata: { name: role.name },
  });

  ok(res, { role });
}

async function setRolePermissions(req, res) {
  const body = await readJsonBody(req);
  const roleId = Number(req.params.id);
  if (!Number.isFinite(roleId)) {
    throw badRequest('Invalid role id');
  }

  const role = store.applyRolePermissions(roleId, body.permissionKeys || []);

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'role.permissions.update',
    entityType: 'role',
    entityId: role.id,
    metadata: { permissionKeys: body.permissionKeys || [] },
  });

  ok(res, { role });
}

async function listPermissions(req, res) {
  ok(res, { permissions: store.listPermissions() });
}

async function createPermission(req, res) {
  const body = await readJsonBody(req);
  const permission = store.createPermission({
    key: body.key,
    description: body.description,
  });

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'permission.create',
    entityType: 'permission',
    entityId: permission.id,
    metadata: { key: permission.key },
  });

  created(res, { permission });
}

async function updatePermission(req, res) {
  const body = await readJsonBody(req);
  const permissionId = Number(req.params.id);
  if (!Number.isFinite(permissionId)) {
    throw badRequest('Invalid permission id');
  }

  const permission = store.updatePermission(permissionId, body);

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'permission.update',
    entityType: 'permission',
    entityId: permission.id,
    metadata: body,
  });

  ok(res, { permission });
}

async function deletePermission(req, res) {
  const permissionId = Number(req.params.id);
  if (!Number.isFinite(permissionId)) {
    throw badRequest('Invalid permission id');
  }

  const permission = store.deletePermission(permissionId);

  store.createAuditLog({
    actorUserId: req.user.id,
    action: 'permission.delete',
    entityType: 'permission',
    entityId: permission.id,
    metadata: { key: permission.key },
  });

  ok(res, { permission });
}

async function listAuditLogs(req, res) {
  const { limit, offset } = parseLimitOffset(req.query || {});
  const logs = store.listAuditLogs().slice(offset, offset + limit);
  ok(res, { auditLogs: logs, limit, offset });
}

module.exports = {
  stats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  setRolePermissions,
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  listAuditLogs,
};
