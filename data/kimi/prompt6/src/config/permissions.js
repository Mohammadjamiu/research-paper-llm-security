const permissions = {
  // User management permissions
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  
  // Role management permissions
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',
  ROLES_DELETE: 'roles:delete',
  
  // Permission management permissions
  PERMISSIONS_READ: 'permissions:read',
  PERMISSIONS_WRITE: 'permissions:write',
  
  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_SETTINGS_READ: 'system:settings:read',
  SYSTEM_SETTINGS_WRITE: 'system:settings:write',
  
  // Audit permissions
  AUDIT_READ: 'audit:read',
  
  // Content permissions
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish'
};

// Permission groups for easier management
const permissionGroups = {
  users: [
    permissions.USERS_READ,
    permissions.USERS_WRITE,
    permissions.USERS_DELETE
  ],
  roles: [
    permissions.ROLES_READ,
    permissions.ROLES_WRITE,
    permissions.ROLES_DELETE
  ],
  permissions: [
    permissions.PERMISSIONS_READ,
    permissions.PERMISSIONS_WRITE
  ],
  system: [
    permissions.SYSTEM_ADMIN,
    permissions.SYSTEM_SETTINGS_READ,
    permissions.SYSTEM_SETTINGS_WRITE
  ],
  audit: [
    permissions.AUDIT_READ
  ],
  content: [
    permissions.CONTENT_READ,
    permissions.CONTENT_WRITE,
    permissions.CONTENT_DELETE,
    permissions.CONTENT_PUBLISH
  ]
};

// Default role definitions
const defaultRoles = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: Object.values(permissions)
  },
  ADMIN: {
    name: 'Admin',
    description: 'User and role management access',
    isSystem: true,
    permissions: [
      permissions.USERS_READ,
      permissions.USERS_WRITE,
      permissions.USERS_DELETE,
      permissions.ROLES_READ,
      permissions.ROLES_WRITE,
      permissions.PERMISSIONS_READ,
      permissions.SYSTEM_SETTINGS_READ,
      permissions.AUDIT_READ,
      permissions.CONTENT_READ,
      permissions.CONTENT_WRITE,
      permissions.CONTENT_DELETE,
      permissions.CONTENT_PUBLISH
    ]
  },
  EDITOR: {
    name: 'Editor',
    description: 'Content management access',
    isSystem: true,
    permissions: [
      permissions.USERS_READ,
      permissions.CONTENT_READ,
      permissions.CONTENT_WRITE,
      permissions.CONTENT_DELETE,
      permissions.CONTENT_PUBLISH
    ]
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access',
    isSystem: true,
    permissions: [
      permissions.USERS_READ,
      permissions.ROLES_READ,
      permissions.PERMISSIONS_READ,
      permissions.CONTENT_READ
    ]
  }
};

module.exports = {
  permissions,
  permissionGroups,
  defaultRoles
};
