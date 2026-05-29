const { PermissionService } = require('../services');
const { asyncHandler, successResponse } = require('../utils/helpers');

class PermissionController {
  /**
   * List all permissions
   * GET /api/permissions
   */
  static list = asyncHandler(async (req, res) => {
    const { permissions, grouped, total } = await PermissionService.list();
    res.json(successResponse({ permissions, grouped, total }));
  });

  /**
   * Get permission by ID
   * GET /api/permissions/:id
   */
  static getById = asyncHandler(async (req, res) => {
    const permission = await PermissionService.getById(req.validated.params.id);
    res.json(successResponse(permission));
  });

  /**
   * Get permissions by resource
   * GET /api/permissions/resource/:resource
   */
  static getByResource = asyncHandler(async (req, res) => {
    const permissions = await PermissionService.getByResource(req.params.resource);
    res.json(successResponse(permissions));
  });

  /**
   * Get all permission resources
   * GET /api/permissions/resources
   */
  static getResources = asyncHandler(async (req, res) => {
    const resources = await PermissionService.getResources();
    res.json(successResponse(resources));
  });

  /**
   * Create new permission
   * POST /api/permissions
   */
  static create = asyncHandler(async (req, res) => {
    const permission = await PermissionService.create(req.validated.body, req.user.id);
    res.status(201).json(successResponse(permission, 'Permission created successfully'));
  });

  /**
   * Update permission
   * PUT /api/permissions/:id
   */
  static update = asyncHandler(async (req, res) => {
    const permission = await PermissionService.update(
      req.validated.params.id,
      req.validated.body,
      req.user.id
    );
    res.json(successResponse(permission, 'Permission updated successfully'));
  });

  /**
   * Delete permission
   * DELETE /api/permissions/:id
   */
  static delete = asyncHandler(async (req, res) => {
    const result = await PermissionService.delete(req.validated.params.id, req.user.id);
    res.json(successResponse(result, 'Permission deleted successfully'));
  });
}

module.exports = PermissionController;
