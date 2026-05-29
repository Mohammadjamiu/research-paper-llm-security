/**
 * Simple in-memory user store
 * In production, replace with a database (MongoDB, PostgreSQL, etc.)
 */
class UserModel {
  constructor() {
    this.users = [];
    this.nextId = 1;
  }

  /**
   * Find user by email
   * @param {String} email 
   * @returns {Object|null}
   */
  findByEmail(email) {
    return this.users.find(user => user.email === email) || null;
  }

  /**
   * Find user by ID
   * @param {Number} id 
   * @returns {Object|null}
   */
  findById(id) {
    return this.users.find(user => user.id === id) || null;
  }

  /**
   * Find user by username
   * @param {String} username 
   * @returns {Object|null}
   */
  findByUsername(username) {
    return this.users.find(user => user.username === username) || null;
  }

  /**
   * Create a new user
   * @param {Object} userData 
   * @returns {Object}
   */
  create(userData) {
    const user = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  /**
   * Get all users (excluding password)
   * @returns {Array}
   */
  getAll() {
    return this.users.map(({ password, ...user }) => user);
  }

  /**
   * Get user by ID (excluding password)
   * @param {Number} id 
   * @returns {Object|null}
   */
  getById(id) {
    const user = this.findById(id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

// Export singleton instance
module.exports = new UserModel();
