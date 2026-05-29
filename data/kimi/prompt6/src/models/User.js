const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/connection');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.isActive = data.is_active === 1 || data.is_active === true;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.roles = data.roles || [];
    this.permissions = data.permissions || [];
  }

  get fullName() {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.email;
  }

  static findAll(options = {}) {
    const { limit = 50, offset = 0, search = '', isActive } = options;
    
    let query = `
      SELECT u.*, 
        GROUP_CONCAT(DISTINCT r.name) as role_names,
        GROUP_CONCAT(DISTINCT p.name) as permission_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (search) {
      conditions.push(`(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (isActive !== undefined) {
      conditions.push('u.is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => new User({
      ...row,
      roles: row.role_names ? row.role_names.split(',') : [],
      permissions: row.permission_names ? [...new Set(row.permission_names.split(','))] : []
    }));
  }

  static findById(id, withRoles = true) {
    let query = 'SELECT * FROM users WHERE id = ?';
    const row = db.prepare(query).get(id);
    
    if (!row) return null;
    
    const user = new User(row);
    
    if (withRoles) {
      user.roles = this.getUserRoles(id);
      user.permissions = this.getUserPermissions(id);
    }
    
    return user;
  }

  static findByEmail(email) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return null;
    
    const user = new User(row);
    user.roles = this.getUserRoles(row.id);
    user.permissions = this.getUserPermissions(row.id);
    
    return user;
  }

  static getUserRoles(userId) {
    const query = `
      SELECT r.* FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `;
    return db.prepare(query).all(userId);
  }

  static getUserPermissions(userId) {
    const query = `
      SELECT DISTINCT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `;
    return db.prepare(query).all(userId);
  }

  static create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, first_name, last_name, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.email,
      data.password,
      data.firstName || null,
      data.lastName || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      now,
      now
    );
    
    // Assign roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      const roleStmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      const insertRoles = db.transaction((roles) => {
        for (const roleId of roles) {
          roleStmt.run(id, roleId);
        }
      });
      insertRoles(data.roleIds);
    }
    
    return this.findById(id);
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.password !== undefined) {
      fields.push('password = ?');
      values.push(data.password);
    }
    if (data.firstName !== undefined) {
      fields.push('first_name = ?');
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push('last_name = ?');
      values.push(data.lastName);
    }
    if (data.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }
    if (data.lastLogin !== undefined) {
      fields.push('last_login = ?');
      values.push(data.lastLogin);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    // Update roles if provided
    if (data.roleIds !== undefined) {
      // Remove existing roles
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
      
      // Add new roles
      if (data.roleIds.length > 0) {
        const roleStmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
        const insertRoles = db.transaction((roles) => {
          for (const roleId of roles) {
            roleStmt.run(id, roleId);
          }
        });
        insertRoles(data.roleIds);
      }
    }
    
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static count(options = {}) {
    let query = 'SELECT COUNT(*) as count FROM users';
    const conditions = [];
    const params = [];
    
    if (options.isActive !== undefined) {
      conditions.push('is_active = ?');
      params.push(options.isActive ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const row = db.prepare(query).get(...params);
    return row.count;
  }

  hasPermission(permissionName) {
    return this.permissions.some(p => p.name === permissionName);
  }

  hasAnyPermission(permissionNames) {
    return permissionNames.some(name => this.hasPermission(name));
  }

  hasAllPermissions(permissionNames) {
    return permissionNames.every(name => this.hasPermission(name));
  }

  hasRole(roleName) {
    return this.roles.some(r => r.name === roleName);
  }
}

module.exports = User;
