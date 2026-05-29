const { sendJson } = require('./utils/http');
const { authenticate } = require('./middleware/authenticate');
const { requirePermission } = require('./middleware/authorize');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const { notFound } = require('./errors');

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function matchPath(pattern, pathname) {
  const patternParts = normalizePath(pattern).split('/').filter(Boolean);
  const pathParts = normalizePath(pathname).split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

function route(method, path, middlewares, handler) {
  return { method, path, middlewares, handler };
}

const routes = [
  route('GET', '/health', [], async (req, res) => {
    sendJson(res, 200, { data: { ok: true, service: 'admin-dashboard-backend' } });
  }),
  route('POST', '/auth/register', [], authController.register),
  route('POST', '/auth/login', [], authController.login),
  route('GET', '/me', [authenticate], authController.me),
  route('GET', '/admin/stats', [authenticate, requirePermission('dashboard.view')], adminController.stats),
  route('GET', '/admin/users', [authenticate, requirePermission('users.read')], adminController.listUsers),
  route('POST', '/admin/users', [authenticate, requirePermission('users.create')], adminController.createUser),
  route('PATCH', '/admin/users/:id', [authenticate, requirePermission('users.update')], adminController.updateUser),
  route('DELETE', '/admin/users/:id', [authenticate, requirePermission('users.delete')], adminController.deleteUser),
  route('GET', '/admin/roles', [authenticate, requirePermission('roles.read')], adminController.listRoles),
  route('POST', '/admin/roles', [authenticate, requirePermission('roles.create')], adminController.createRole),
  route('PATCH', '/admin/roles/:id', [authenticate, requirePermission('roles.update')], adminController.updateRole),
  route('DELETE', '/admin/roles/:id', [authenticate, requirePermission('roles.delete')], adminController.deleteRole),
  route('PUT', '/admin/roles/:id/permissions', [authenticate, requirePermission('roles.update')], adminController.setRolePermissions),
  route('GET', '/admin/permissions', [authenticate, requirePermission('permissions.read')], adminController.listPermissions),
  route('POST', '/admin/permissions', [authenticate, requirePermission('permissions.create')], adminController.createPermission),
  route('PATCH', '/admin/permissions/:id', [authenticate, requirePermission('permissions.update')], adminController.updatePermission),
  route('DELETE', '/admin/permissions/:id', [authenticate, requirePermission('permissions.delete')], adminController.deletePermission),
  route('GET', '/admin/audit-logs', [authenticate, requirePermission('audit.read')], adminController.listAuditLogs),
];

async function handleRequest(req, res, url) {
  const pathname = normalizePath(url.pathname);
  const method = req.method.toUpperCase();

  const routeMatch = routes.find((routeDefinition) => routeDefinition.method === method && matchPath(routeDefinition.path, pathname));
  if (!routeMatch) {
    throw notFound('Route not found');
  }

  req.params = matchPath(routeMatch.path, pathname) || {};
  req.query = Object.fromEntries(url.searchParams.entries());

  for (const middleware of routeMatch.middlewares) {
    await middleware(req, res);
    if (res.writableEnded) {
      return;
    }
  }

  await routeMatch.handler(req, res);
}

module.exports = {
  handleRequest,
};
