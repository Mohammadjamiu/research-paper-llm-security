const crypto = require('crypto');

// Token configuration
const TOKEN_CONFIG = {
  length: 64,                    // Length of the token string
  expiresIn: 60 * 60 * 1000,     // Token expiry: 1 hour in milliseconds
  algorithm: 'sha256',           // Hashing algorithm
};

/**
 * Generate a cryptographically secure random token
 * @returns {string} A secure random token
 */
function generateSecureToken() {
  // Generate 32 random bytes and convert to hex (64 characters)
  return crypto.randomBytes(TOKEN_CONFIG.length / 2).toString('hex');
}

/**
 * Hash a token for storage (security best practice)
 * Note: In this implementation, we store the plain token but could hash it
 * for extra security. Hashing would require different lookup strategy.
 * @param {string} token - The token to hash
 * @returns {string} The hashed token
 */
function hashToken(token) {
  return crypto
    .createHash(TOKEN_CONFIG.algorithm)
    .update(token)
    .digest('hex');
}

/**
 * Generate token expiration date
 * @returns {Date} The expiration date
 */
function getTokenExpiration() {
  return new Date(Date.now() + TOKEN_CONFIG.expiresIn);
}

/**
 * Check if a token is expired
 * @param {Date} expiresAt - The expiration date
 * @returns {boolean} True if expired, false otherwise
 */
function isTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Generate a complete token object with metadata
 * @param {number} userId - The user ID associated with the token
 * @returns {Object} Token object with value and expiration
 */
function generateResetToken(userId) {
  const token = generateSecureToken();
  const expiresAt = getTokenExpiration();
  
  return {
    token,
    expiresAt,
    userId,
  };
}

/**
 * Validate token format
 * @param {string} token - The token to validate
 * @returns {boolean} True if valid format, false otherwise
 */
function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Token should be exactly 64 hex characters
  const hexRegex = /^[a-f0-9]{64}$/i;
  return hexRegex.test(token);
}

module.exports = {
  generateSecureToken,
  hashToken,
  getTokenExpiration,
  isTokenExpired,
  generateResetToken,
  isValidTokenFormat,
  TOKEN_CONFIG,
};
