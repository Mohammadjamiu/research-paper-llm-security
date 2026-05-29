const { User, Role, Permission, AuditLog } = require('../models');
const { db } = require('../database/connection');

class AdminService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const userStats = await this.getUserStats();
    const roleStats = await this.getRoleStats();
    const permissionStats = await this.getPermissionStats();
    const auditStats = await this.getAuditStats();

    return {
      users: userStats,
      roles: roleStats,
      permissions: permissionStats,
      audit: auditStats
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    const total = User.count();
    const active = User.count({ isActive: true });
    const inactive = User.count({ isActive: false });

    // Recent users (last 7 days)
    const recentUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= DATE('now', '-7 days')
    `).get().count;

    // Users by role
    const byRole = db.prepare(`
      SELECT r.name, COUNT(ur.user_id) as count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id
      ORDER BY count DESC
    `).all();

    return {
      total,
      active,
      inactive,
      recentUsers,
      byRole
    };
  }

  /**
   * Get role statistics
   */
  static async getRoleStats() {
    const total = Role.count();
    const roles = Role.findAll();
    
    return {
      total,
      systemRoles: roles.filter(r => r.isSystem).length,
      customRoles: roles.filter(r => !r.isSystem).length
    };
  }

  /**
   * Get permission statistics
   */
  static async getPermissionStats() {
    const total = Permission.count();
    const grouped = Permission.getGroupedPermissions();
    
    const byResource = Object.keys(grouped).map(resource => ({
      resource,
      count: grouped[resource].length
    }));

    return {
      total,
      byResource
    };
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats() {
    // Total audit logs
    const total = AuditLog.count();

    // Today's activity
    const today = db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE DATE(created_at) = DATE('now')
    `).get().count;

    // Recent activity (last 7 days)
    const recent = db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE created_at >= DATE('now', '-7 days')
    `).get().count;

    // Activity by action
    const byAction = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // Activity by resource
    const byResource = db.prepare(`
      SELECT resource, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY resource
      ORDER BY count DESC
      LIMIT 10
    `).all();

    return {
      total,
      today,
      recent,
      byAction,
      byResource
    };
  }

  /**
   * Get system health check
   */
  static async getSystemHealth() {
    const dbStatus = this.checkDatabaseHealth();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime()
    };
  }

  /**
   * Check database health
   */
  static checkDatabaseHealth() {
    try {
      // Simple query to check database connectivity
      db.prepare('SELECT 1').get();
      return {
        status: 'connected',
        responseTime: 'ok'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = AdminService;
