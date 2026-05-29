const { User, Role, Permission, AuditLog } = require('../models');
const { hashPassword } = require('../middleware/auth');

class UserService {
  /**
   * List all users with pagination
   */
  static async list(options = {}) {
    const { limit = 20, offset = 0, search = '', isActive } = options;
    
    const users = User.findAll({ limit, offset, search, isActive });
    const total = User.count({ isActive });

    return { users, total };
  }

  /**
   * Get user by ID
   */
  static async getById(id) {
    const user = User.findById(id);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    return user;
  }

  /**
   * Create new user
   */
  static async create(data, actorId = null) {
    // Check if email exists
    const existingUser = User.findByEmail(data.email);
    if (existingUser) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    // Validate role IDs if provided
    if (data.roleIds && data.roleIds.length > 0) {
      for (const roleId of data.roleIds) {
        const role = Role.findById(roleId, false);
        if (!role) {
          throw Object.assign(new Error(`Role not found: ${roleId}`), { statusCode: 400 });
        }
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = User.create({
      ...data,
      password: hashedPassword
    });

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'USER_CREATE',
      resource: 'users',
      resourceId: user.id,
      details: { email: user.email }
    });

    return user;
  }

  /**
   * Update user
   */
  static async update(id, data, actorId = null) {
    const user = User.findById(id);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    // Check if updating email and it already exists
    if (data.email && data.email !== user.email) {
      const existingUser = User.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
      }
    }

    // Validate role IDs if provided
    if (data.roleIds) {
      for (const roleId of data.roleIds) {
        const role = Role.findById(roleId, false);
        if (!role) {
          throw Object.assign(new Error(`Role not found: ${roleId}`), { statusCode: 400 });
        }
      }
    }

    // Hash password if provided
    let updateData = { ...data };
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    // Update user
    const updatedUser = User.update(id, updateData);

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'USER_UPDATE',
      resource: 'users',
      resourceId: id,
      details: { updatedFields: Object.keys(data) }
    });

    return updatedUser;
  }

  /**
   * Delete user
   */
  static async delete(id, actorId = null) {
    const user = User.findById(id);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    // Prevent self-deletion
    if (id === actorId) {
      throw Object.assign(new Error('Cannot delete your own account'), { statusCode: 400 });
    }

    // Delete user
    const deleted = User.delete(id);

    if (deleted) {
      // Log action
      await AuditLog.create({
        userId: actorId,
        action: 'USER_DELETE',
        resource: 'users',
        resourceId: id,
        details: { email: user.email }
      });
    }

    return { deleted };
  }

  /**
   * Assign roles to user
   */
  static async assignRoles(userId, roleIds, actorId = null) {
    const user = User.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    // Validate all role IDs
    for (const roleId of roleIds) {
      const role = Role.findById(roleId, false);
      if (!role) {
        throw Object.assign(new Error(`Role not found: ${roleId}`), { statusCode: 400 });
      }
    }

    // Update user roles
    const updatedUser = User.update(userId, { roleIds });

    // Log action
    await AuditLog.create({
      userId: actorId,
      action: 'USER_ROLE_ASSIGN',
      resource: 'users',
      resourceId: userId,
      details: { assignedRoles: roleIds }
    });

    return updatedUser;
  }

  /**
   * Get user statistics
   */
  static async getStats() {
    const total = User.count();
    const active = User.count({ isActive: true });
    const inactive = User.count({ isActive: false });

    // Users by role
    const { db } = require('../database/connection');
    const usersByRole = db.prepare(`
      SELECT r.name, COUNT(ur.user_id) as count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id
    `).all();

    return {
      total,
      active,
      inactive,
      usersByRole
    };
  }
}

module.exports = UserService;
