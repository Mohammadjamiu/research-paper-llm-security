const { AuditLog } = require('../models');
const { AdminService } = require('../services');
const { 
  asyncHandler, 
  successResponse, 
  getPagination, 
  paginatedResponse 
} = require('../utils/helpers');

class AdminController {
  /**
   * Get dashboard statistics
   * GET /api/admin/stats
   */
  static getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await AdminService.getDashboardStats();
    res.json(successResponse(stats));
  });

  /**
   * Get audit logs
   * GET /api/admin/audit-logs
   */
  static getAuditLogs = asyncHandler(async (req, res) => {
    const { limit, offset, page } = getPagination(req.validated.query);
    const { userId, action, resource, startDate, endDate } = req.validated.query;
    
    const logs = AuditLog.findAll({ 
      limit, 
      offset, 
      userId, 
      action, 
      resource, 
      startDate, 
      endDate 
    });
    
    const total = AuditLog.count({ userId, action, resource, startDate, endDate });
    
    res.json(paginatedResponse(logs, total, { page, limit }));
  });

  /**
   * Get audit log by ID
   * GET /api/admin/audit-logs/:id
   */
  static getAuditLogById = asyncHandler(async (req, res) => {
    const log = AuditLog.findById(req.validated.params.id);
    if (!log) {
      throw Object.assign(new Error('Audit log not found'), { statusCode: 404 });
    }
    res.json(successResponse(log));
  });

  /**
   * Get audit statistics
   * GET /api/admin/audit-stats
   */
  static getAuditStats = asyncHandler(async (req, res) => {
    const stats = await AdminService.getAuditStats();
    res.json(successResponse(stats));
  });

  /**
   * Get system health
   * GET /api/admin/health
   */
  static getSystemHealth = asyncHandler(async (req, res) => {
    const health = await AdminService.getSystemHealth();
    res.json(successResponse(health));
  });
}

module.exports = AdminController;
