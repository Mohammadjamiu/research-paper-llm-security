const { RoleService } = require('../services');
const { asyncHandler, successResponse } = require('../utils/helpers');

class RoleController {
  /**
   * List all roles
   * GET /api/roles
   */
  static list = asyncHandler(async (req, res) => {
    const { roles, total } = await RoleService.list();
    res.json(successResponse({ roles, total }));
  });

  /**
   * Get role by ID
   * GET /api/roles/:id
   */
  static getById = asyncHandler(async (req, res) => {
    const role = await RoleService.getById(req.validated.params.id);
    res.json(successResponse(role));
  });

  /**
   * Create new role
   * POST /api/roles
   */
  static create = asyncHandler(async (req, res) => {
    const role = await RoleService.create(req.validated.body, req.user.id);
    res.status(201).json(successResponse(role, 'Role created successfully'));
  });

  /**
   * Update role
   * PUT /api/roles/:id
   */
  static update = asyncHandler(async (req, res) => {
    const role = await RoleService.update(
      req.validated.params.id,
      req.validated.body,
      req.user.id
    );
    res.json(successResponse(role, 'Role updated successfully'));
  });

  /**
   * Delete role
   * DELETE /api/roles/:id
   */
  static delete = asyncHandler(async (req, res) => {
    const result = await RoleService.delete(req.validated.params.id, req.user.id);
    res.json(successResponse(result, 'Role deleted successfully'));
  });

  /**
   * Assign permissions to role
   * PUT /api/roles/:id/permissions
   */
  static assignPermissions = asyncHandler(async (req, res) => {
    const role = await RoleService.assignPermissions(
      req.validated.params.id,
      req.validated.body.permissionIds,
      req.user.id
    );
    res.json(successResponse(role, 'Permissions assigned successfully'));
  });

  /**
   * Get role statistics
   * GET /api/roles/stats
   */
  static getStats = asyncHandler(async (req, res) => {
    const stats = await RoleService.getStats();
    res.json(successResponse(stats));
  });
}

module.exports = RoleController;
