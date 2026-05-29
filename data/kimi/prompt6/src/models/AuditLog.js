const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/connection');

class AuditLog {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.action = data.action;
    this.resource = data.resource;
    this.resourceId = data.resource_id;
    this.details = data.details ? JSON.parse(data.details) : null;
    this.ipAddress = data.ip_address;
    this.userAgent = data.user_agent;
    this.createdAt = data.created_at;
    this.user = data.user_email ? {
      id: data.user_id,
      email: data.user_email,
      firstName: data.user_first_name,
      lastName: data.user_last_name
    } : null;
  }

  static findAll(options = {}) {
    const { limit = 50, offset = 0, userId, action, resource, startDate, endDate } = options;
    
    let query = `
      SELECT al.*, u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (userId) {
      conditions.push('al.user_id = ?');
      params.push(userId);
    }
    if (action) {
      conditions.push('al.action = ?');
      params.push(action);
    }
    if (resource) {
      conditions.push('al.resource = ?');
      params.push(resource);
    }
    if (startDate) {
      conditions.push('al.created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('al.created_at <= ?');
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const rows = db.prepare(query).all(...params);
    return rows.map(row => new AuditLog(row));
  }

  static findById(id) {
    const query = `
      SELECT al.*, u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `;
    const row = db.prepare(query).get(id);
    return row ? new AuditLog(row) : null;
  }

  static create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.userId || null,
      data.action,
      data.resource,
      data.resourceId || null,
      data.details ? JSON.stringify(data.details) : null,
      data.ipAddress || null,
      data.userAgent || null,
      now
    );
    
    return this.findById(id);
  }

  static count(options = {}) {
    const { userId, action, resource, startDate, endDate } = options;
    
    let query = 'SELECT COUNT(*) as count FROM audit_logs';
    const conditions = [];
    const params = [];
    
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (resource) {
      conditions.push('resource = ?');
      params.push(resource);
    }
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const row = db.prepare(query).get(...params);
    return row.count;
  }

  static getStats(days = 30) {
    const query = `
      SELECT 
        action,
        resource,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM audit_logs
      WHERE created_at >= DATE('now', '-${days} days')
      GROUP BY action, resource, DATE(created_at)
      ORDER BY date DESC, count DESC
    `;
    return db.prepare(query).all();
  }

  static cleanup(days = 90) {
    const stmt = db.prepare(`DELETE FROM audit_logs WHERE created_at < DATE('now', '-${days} days')`);
    const result = stmt.run();
    return result.changes;
  }
}

module.exports = AuditLog;
