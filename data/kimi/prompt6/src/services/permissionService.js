const { Permission, AuditLog } = require('../models');

class PermissionService {
  /**
   * List all permissions
   */
  static async list() {
    const permissions = Permission.findAll();
    const grouped = Permission.getGroupedPermissions();
    const total = Permission.count();
    
    return { permissions, grouped, total };
  }

  /**
   * Get permission by ID
   */
  static async getById(id) {
    const permission = Permission.findById(id);
    if (!permission) {
      throw Object.assign(new Error('Permission not found'), { statusCode: 404 });
    }
    return permission;
  }

  /**
   * Get permission by name
   */
  static async getByName(name) {
    const permission = Permission.findByName(name);
    if (!permission) {
      throw Object.assign(new Error('Permission not found'), { statusCode: 404 });
    }
    return permission;
  }

  /**
   * Create new permission
   */
  static async create(data, actorId = null) {
    // Check if name already exists
    const existingPermission = Permission.findByName(data.name);
    if (existingPermission) {
      throw Object.assign(new Error('Permission name already exists'), { statusCode: 409 });
    }

    // Create permission
    const permission = Permission.create(data);

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'PERMISSION_CREATE',
      resource: 'permissions',
      resourceId: permission.id,
      details: { name: permission.name }
    });

    return permission;
  }

  /**
   * Update permission
   */
  static async update(id, data, actorId = null) {
    const permission = Permission.findById(id);
    if (!permission) {
      throw Object.assign(new Error('Permission not found'), { statusCode: 404 });
    }

    // Update permission (only description can be updated)
    const updatedPermission = Permission.update(id, data);

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'PERMISSION_UPDATE',
      resource: 'permissions',
      resourceId: id,
      details: { updatedFields: Object.keys(data) }
    });

    return updatedPermission;
  }

  /**
   * Delete permission
   */
  static async delete(id, actorId = null) {
    const permission = Permission.findById(id);
    if (!permission) {
      throw Object.assign(new Error('Permission not found'), { statusCode: 404 });
    }

    // Delete permission
    const deleted = Permission.delete(id);

    if (deleted) {
      // Log action
      await AuditLog.create({
        userId: actorId,
        action: 'PERMISSION_DELETE',
        resource: 'permissions',
        resourceId: id,
        details: { name: permission.name }
      });
    }

    return { deleted };
  }

  /**
   * Get permissions by resource
   */
  static async getByResource(resource) {
    const permissions = Permission.findByResource(resource);
    return permissions;
  }

  /**
   * Get all available permission resources
   */
  static async getResources() {
    const permissions = Permission.findAll();
    const resources = [...new Set(permissions.map(p => p.resource))];
    return resources;
  }

  /**
   * Initialize default permissions
   */
  static async initializeDefaultPermissions(permissions) {
    const created = [];
    
    for (const [key, name] of Object.entries(permissions)) {
      const existing = Permission.findByName(name);
      if (!existing) {
        const parts = name.split(':');
        const permission = Permission.create({
          name,
          resource: parts[0],
          action: parts[1],
          description: `${parts[0]} ${parts[1]} permission`
        });
        created.push(permission);
      }
    }
    
    return created;
  }
}

module.exports = PermissionService;
