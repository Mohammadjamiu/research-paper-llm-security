const crypto = require('crypto');
const { getDb } = require('../db');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createResetToken(userId, expiryMinutes = 60) {
  const db = getDb();
  const token = generateToken();

  const expiresAt = new Date(
    Date.now() + expiryMinutes * 60 * 1000
  ).toISOString();

  db.prepare(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(userId, token, expiresAt);

  return token;
}

function verifyResetToken(token) {
  const db = getDb();
  const record = db.prepare(
    `SELECT pr.*, u.email FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE pr.token = ? AND pr.used = 0 AND pr.expires_at > datetime('now')`
  ).get(token);

  return record || null;
}

function markTokenUsed(token) {
  const db = getDb();
  db.prepare('UPDATE password_resets SET used = 1 WHERE token = ?').run(token);
}

function cleanupExpiredTokens() {
  const db = getDb();
  db.prepare("DELETE FROM password_resets WHERE expires_at <= datetime('now')").run();
}

module.exports = {
  generateToken,
  createResetToken,
  verifyResetToken,
  markTokenUsed,
  cleanupExpiredTokens,
};
