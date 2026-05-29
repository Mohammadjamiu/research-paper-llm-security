const { User, AuditLog } = require('../models');
const { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens
} = require('../middleware/auth');

class AuthService {
  /**
   * Register a new user
   */
  static async register(data) {
    // Check if email already exists
    const existingUser = User.findByEmail(data.email);
    if (existingUser) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = User.create({
      ...data,
      password: hashedPassword
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Login user
   */
  static async login(email, password, ipAddress, userAgent) {
    // Find user by email
    const user = User.findByEmail(email);
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    // Check if user is active
    if (!user.isActive) {
      throw Object.assign(new Error('Account is deactivated'), { statusCode: 401 });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    // Update last login
    User.update(user.id, { lastLogin: new Date().toISOString() });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Log login
    await AuditLog.create({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      details: { method: 'password' },
      ipAddress,
      userAgent
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h'
      }
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken, ipAddress, userAgent) {
    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }

    // Get user
    const user = User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw Object.assign(new Error('User not found or inactive'), { statusCode: 401 });
    }

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    // Log token refresh
    await AuditLog.create({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      resource: 'auth',
      ipAddress,
      userAgent
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: '24h'
    };
  }

  /**
   * Logout user
   */
  static async logout(refreshToken, userId, ipAddress, userAgent) {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Log logout
    await AuditLog.create({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress,
      userAgent
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(userId, ipAddress, userAgent) {
    await revokeAllUserRefreshTokens(userId);

    // Log logout all
    await AuditLog.create({
      userId,
      action: 'LOGOUT_ALL',
      resource: 'auth',
      details: { message: 'Logged out from all devices' },
      ipAddress,
      userAgent
    });

    return { message: 'Logged out from all devices' };
  }

  /**
   * Change password
   */
  static async changePassword(userId, currentPassword, newPassword, ipAddress, userAgent) {
    const user = User.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    User.update(userId, { password: hashedPassword });

    // Revoke all refresh tokens for security
    await revokeAllUserRefreshTokens(userId);

    // Log password change
    await AuditLog.create({
      userId,
      action: 'PASSWORD_CHANGE',
      resource: 'auth',
      ipAddress,
      userAgent
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user with full details
   */
  static async getCurrentUser(userId) {
    const user = User.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = AuthService;
