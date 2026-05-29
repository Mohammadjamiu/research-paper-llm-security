const { Role, Permission, AuditLog } = require('../models');

class RoleService {
  /**
   * List all roles
   */
  static async list() {
    const roles = Role.findAll();
    const total = Role.count();
    return { roles, total };
  }

  /**
   * Get role by ID
   */
  static async getById(id) {
    const role = Role.findById(id);
    if (!role) {
      throw Object.assign(new Error('Role not found'), { statusCode: 404 });
    }
    return role;
  }

  /**
   * Create new role
   */
  static async create(data, actorId = null) {
    // Check if name already exists
    const existingRole = Role.findByName(data.name);
    if (existingRole) {
      throw Object.assign(new Error('Role name already exists'), { statusCode: 409 });
    }

    // Validate permission IDs if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      for (const permId of data.permissionIds) {
        const perm = Permission.findById(permId);
        if (!perm) {
          throw Object.assign(new Error(`Permission not found: ${permId}`), { statusCode: 400 });
        }
      }
    }

    // Create role
    const role = Role.create(data);

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'ROLE_CREATE',
      resource: 'roles',
      resourceId: role.id,
      details: { name: role.name }
    });

    return role;
  }

  /**
   * Update role
   */
  static async update(id, data, actorId = null) {
    const role = Role.findById(id, false);
    if (!role) {
      throw Object.assign(new Error('Role not found'), { statusCode: 404 });
    }

    // Prevent modification of system roles' names
    if (role.isSystem && data.name && data.name !== role.name) {
      throw Object.assign(new Error('Cannot modify system role name'), { statusCode: 403 });
    }

    // Check if updating name and it already exists
    if (data.name && data.name !== role.name) {
      const existingRole = Role.findByName(data.name);
      if (existingRole) {
        throw Object.assign(new Error('Role name already exists'), { statusCode: 409 });
      }
    }

    // Validate permission IDs if provided
    if (data.permissionIds) {
      for (const permId of data.permissionIds) {
        const perm = Permission.findById(permId);
        if (!perm) {
          throw Object.assign(new Error(`Permission not found: ${permId}`), { statusCode: 400 });
        }
      }
    }

    // Update role
    const updatedRole = Role.update(id, data);

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'ROLE_UPDATE',
      resource: 'roles',
      resourceId: id,
      details: { updatedFields: Object.keys(data) }
    });

    return updatedRole;
  }

  /**
   * Delete role
   */
  static async delete(id, actorId = null) {
    const role = Role.findById(id, false);
    if (!role) {
      throw Object.assign(new Error('Role not found'), { statusCode: 404 });
    }

    // Prevent deletion of system roles
    if (role.isSystem) {
      throw Object.assign(new Error('Cannot delete system roles'), { statusCode: 403 });
    }

    // Delete role
    const deleted = Role.delete(id);

    if (deleted) {
      // Log action
      await AuditLog.create({
        userId: actorId,
        action: 'ROLE_DELETE',
        resource: 'roles',
        resourceId: id,
        details: { name: role.name }
      });
    }

    return { deleted };
  }

  /**
   * Assign permissions to role
   */
  static async assignPermissions(roleId, permissionIds, actorId = null) {
    const role = Role.findById(roleId, false);
    if (!role) {
      throw Object.assign(new Error('Role not found'), { statusCode: 404 });
    }

    // Validate all permission IDs
    for (const permId of permissionIds) {
      const perm = Permission.findById(permId);
      if (!perm) {
        throw Object.assign(new Error(`Permission not found: ${permId}`), { statusCode: 400 });
      }
    }

    // Update role permissions
    const updatedRole = Role.update(roleId, { permissionIds });

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'ROLE_PERMISSION_ASSIGN',
      resource: 'roles',
      resourceId: roleId,
      details: { assignedPermissions: permissionIds }
    });

    return updatedRole;
  }

  /**
   * Get role statistics
   */
  static async getStats() {
    const total = Role.count();
    const systemRoles = Role.findAll().filter(r => r.isSystem).length;

    return {
      total,
      systemRoles,
      customRoles: total - systemRoles
    };
  }
}

module.exports = RoleService;
