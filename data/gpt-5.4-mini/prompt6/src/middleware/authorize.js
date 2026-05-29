const { forbidden } = require('../errors');
const store = require('../store');

function hasPermission(user, permissionKey) {
  if (!user) {
    return false;
  }

  return store.getPermissionKeysForRole(user.role?.id || user.roleId).includes(permissionKey);
}

function requirePermission(permissionKey) {
  return async function permissionMiddleware(req) {
    if (!req.user) {
      throw forbidden('Authentication required');
    }

    if (!hasPermission(req.user, permissionKey)) {
      throw forbidden('Insufficient permissions');
    }
  };
}

module.exports = {
  hasPermission,
  requirePermission,
};
