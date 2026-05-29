const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/connection');

class Permission {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.resource = data.resource;
    this.action = data.action;
    this.createdAt = data.created_at;
  }

  static findAll() {
    const query = 'SELECT * FROM permissions ORDER BY resource, action';
    const rows = db.prepare(query).all();
    return rows.map(row => new Permission(row));
  }

  static findById(id) {
    const row = db.prepare('SELECT * FROM permissions WHERE id = ?').get(id);
    return row ? new Permission(row) : null;
  }

  static findByName(name) {
    const row = db.prepare('SELECT * FROM permissions WHERE name = ?').get(name);
    return row ? new Permission(row) : null;
  }

  static findByResource(resource) {
    const rows = db.prepare('SELECT * FROM permissions WHERE resource = ? ORDER BY action').all(resource);
    return rows.map(row => new Permission(row));
  }

  static create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Parse resource and action from name if not provided
    let { resource, action } = data;
    if (!resource || !action) {
      const parts = data.name.split(':');
      resource = resource || parts[0];
      action = action || parts[1];
    }
    
    const stmt = db.prepare(`
      INSERT INTO permissions (id, name, description, resource, action, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name,
      data.description || null,
      resource,
      action,
      now
    );
    
    return this.findById(id);
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    const stmt = db.prepare(`UPDATE permissions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values, id);
    
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM permissions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static count() {
    const row = db.prepare('SELECT COUNT(*) as count FROM permissions').get();
    return row.count;
  }

  static getGroupedPermissions() {
    const permissions = this.findAll();
    const grouped = {};
    
    for (const perm of permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    }
    
    return grouped;
  }
}

module.exports = Permission;
