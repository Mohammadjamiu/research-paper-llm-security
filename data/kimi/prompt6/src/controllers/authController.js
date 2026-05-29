const { AuthService } = require('../services');
const { asyncHandler, successResponse } = require('../utils/helpers');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static register = asyncHandler(async (req, res) => {
    const user = await AuthService.register(req.validated.body);
    res.status(201).json(successResponse(user, 'User registered successfully'));
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  static login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(
      req.validated.body.email,
      req.validated.body.password,
      req.ip,
      req.headers['user-agent']
    );
    res.json(successResponse(result, 'Login successful'));
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const tokens = await AuthService.refreshToken(
      req.validated.body.refreshToken,
      req.ip,
      req.headers['user-agent']
    );
    res.json(successResponse(tokens, 'Token refreshed successfully'));
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static logout = asyncHandler(async (req, res) => {
    const result = await AuthService.logout(
      req.body?.refreshToken,
      req.user?.id,
      req.ip,
      req.headers['user-agent']
    );
    res.json(successResponse(null, result.message));
  });

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  static logoutAll = asyncHandler(async (req, res) => {
    const result = await AuthService.logoutAll(
      req.user.id,
      req.ip,
      req.headers['user-agent']
    );
    res.json(successResponse(null, result.message));
  });

  /**
   * Change password
   * POST /api/auth/change-password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const result = await AuthService.changePassword(
      req.user.id,
      req.validated.body.currentPassword,
      req.validated.body.newPassword,
      req.ip,
      req.headers['user-agent']
    );
    res.json(successResponse(null, result.message));
  });

  /**
   * Get current user
   * GET /api/auth/me
   */
  static getCurrentUser = asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.user.id);
    res.json(successResponse(user));
  });
}

module.exports = AuthController;
