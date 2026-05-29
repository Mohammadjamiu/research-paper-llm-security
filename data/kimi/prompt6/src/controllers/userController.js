const { UserService } = require('../services');
const { 
  asyncHandler, 
  successResponse, 
  getPagination, 
  paginatedResponse 
} = require('../utils/helpers');

class UserController {
  /**
   * List all users
   * GET /api/users
   */
  static list = asyncHandler(async (req, res) => {
    const { limit, offset, page } = getPagination(req.validated.query);
    const { search, isActive } = req.validated.query;
    
    const { users, total } = await UserService.list({ 
      limit, 
      offset, 
      search, 
      isActive 
    });
    
    res.json(paginatedResponse(users, total, { page, limit }));
  });

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static getById = asyncHandler(async (req, res) => {
    const user = await UserService.getById(req.validated.params.id);
    res.json(successResponse(user));
  });

  /**
   * Create new user
   * POST /api/users
   */
  static create = asyncHandler(async (req, res) => {
    const user = await UserService.create(req.validated.body, req.user.id);
    res.status(201).json(successResponse(user, 'User created successfully'));
  });

  /**
   * Update user
   * PUT /api/users/:id
   */
  static update = asyncHandler(async (req, res) => {
    const user = await UserService.update(
      req.validated.params.id,
      req.validated.body,
      req.user.id
    );
    res.json(successResponse(user, 'User updated successfully'));
  });

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  static delete = asyncHandler(async (req, res) => {
    const result = await UserService.delete(req.validated.params.id, req.user.id);
    res.json(successResponse(result, 'User deleted successfully'));
  });

  /**
   * Assign roles to user
   * PUT /api/users/:id/roles
   */
  static assignRoles = asyncHandler(async (req, res) => {
    const user = await UserService.assignRoles(
      req.validated.params.id,
      req.validated.body.roleIds,
      req.user.id
    );
    res.json(successResponse(user, 'Roles assigned successfully'));
  });

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  static getStats = asyncHandler(async (req, res) => {
    const stats = await UserService.getStats();
    res.json(successResponse(stats));
  });
}

module.exports = UserController;
