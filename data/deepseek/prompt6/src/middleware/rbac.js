const ROLE_HIERARCHY = {
  admin: 3,
  moderator: 2,
  user: 1,
};

const ROLE_PERMISSIONS = {
  admin: [
    'users:read', 'users:write', 'users:delete',
    'dashboard:read', 'dashboard:write',
    'roles:read', 'roles:write',
    'settings:read', 'settings:write',
  ],
  moderator: [
    'users:read',
    'dashboard:read', 'dashboard:write',
    'roles:read',
  ],
  user: [
    'dashboard:read',
  ],
};

export function hasPermission(requiredPermission) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const rolePermissions = ROLE_PERMISSIONS[userRole];

    if (!rolePermissions) {
      return res.status(403).json({ error: 'Access denied. Unknown role.' });
    }

    if (rolePermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Required permission: ${requiredPermission}`,
    });
  };
}

export function hasRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

export function hasMinimumRole(minimumRole) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: `Access denied. Minimum role required: ${minimumRole}`,
      });
    }

    next();
  };
}

export { ROLE_HIERARCHY, ROLE_PERMISSIONS };
