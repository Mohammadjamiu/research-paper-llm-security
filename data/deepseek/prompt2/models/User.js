const { getDb } = require('../db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

class User {
  static findByEmail(email) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static async create({ email, password, name }) {
    const db = getDb();
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).run(email, hashed, name);
    return result.lastInsertRowid;
  }

  static async verifyPassword(plainText, hashed) {
    return bcrypt.compare(plainText, hashed);
  }

  static async updatePassword(id, newPassword) {
    const db = getDb();
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, id);
  }
}

module.exports = User;
