const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/connection');

class Role {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.isSystem = data.is_system === 1 || data.is_system === true;
    this.createdAt = data.created_at;
    this.permissions = data.permissions || [];
    this.userCount = data.user_count || 0;
  }

  static findAll(options = {}) {
    const { includePermissions = true } = options;
    
    let query = `
      SELECT r.*, COUNT(DISTINCT ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;
    
    const rows = db.prepare(query).all();
    
    return rows.map(row => {
      const role = new Role(row);
      if (includePermissions) {
        role.permissions = this.getRolePermissions(row.id);
      }
      return role;
    });
  }

  static findById(id, includePermissions = true) {
    const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    if (!row) return null;
    
    const role = new Role(row);
    if (includePermissions) {
      role.permissions = this.getRolePermissions(id);
    }
    
    return role;
  }

  static findByName(name) {
    const row = db.prepare('SELECT * FROM roles WHERE name = ?').get(name);
    if (!row) return null;
    
    const role = new Role(row);
    role.permissions = this.getRolePermissions(row.id);
    
    return role;
  }

  static getRolePermissions(roleId) {
    const query = `
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;
    return db.prepare(query).all(roleId);
  }

  static create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO roles (id, name, description, is_system, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name,
      data.description || null,
      data.isSystem ? 1 : 0,
      now
    );
    
    // Assign permissions if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      const permStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
      const insertPermissions = db.transaction((permissions) => {
        for (const permId of permissions) {
          permStmt.run(id, permId);
        }
      });
      insertPermissions(data.permissionIds);
    }
    
    return this.findById(id);
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    
    if (fields.length > 0) {
      const stmt = db.prepare(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values, id);
    }
    
    // Update permissions if provided
    if (data.permissionIds !== undefined) {
      // Remove existing permissions
      db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(id);
      
      // Add new permissions
      if (data.permissionIds.length > 0) {
        const permStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
        const insertPermissions = db.transaction((permissions) => {
          for (const permId of permissions) {
            permStmt.run(id, permId);
          }
        });
        insertPermissions(data.permissionIds);
      }
    }
    
    return this.findById(id);
  }

  static delete(id) {
    // Check if it's a system role
    const role = this.findById(id, false);
    if (role && role.isSystem) {
      throw new Error('Cannot delete system roles');
    }
    
    const stmt = db.prepare('DELETE FROM roles WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static count() {
    const row = db.prepare('SELECT COUNT(*) as count FROM roles').get();
    return row.count;
  }

  hasPermission(permissionName) {
    return this.permissions.some(p => p.name === permissionName);
  }
}

module.exports = Role;
