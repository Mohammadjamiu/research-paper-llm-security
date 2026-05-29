const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Users table created/verified');
      });

      // Password reset tokens table
      db.run(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating password_reset_tokens table:', err);
          reject(err);
          return;
        }
        console.log('Password reset tokens table created/verified');
      });

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', (err) => {
        if (err) console.error('Error creating email index:', err);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_tokens_token ON password_reset_tokens(token)', (err) => {
        if (err) console.error('Error creating token index:', err);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_tokens_expires ON password_reset_tokens(expires_at)', (err) => {
        if (err) console.error('Error creating expires index:', err);
      });

      resolve();
    });
  });
}

// User-related database operations
const userDb = {
  // Create a new user
  createUser: (email, password) => {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
      
      db.run(sql, [email, hashedPassword], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('Email already exists'));
          } else {
            reject(err);
          }
          return;
        }
        resolve({ id: this.lastID, email });
      });
    });
  },

  // Find user by email
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  },

  // Find user by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  },

  // Update user password
  updatePassword: (userId, newPassword) => {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      const sql = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      db.run(sql, [hashedPassword, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  }
};

// Password reset token operations
const tokenDb = {
  // Create a new reset token
  createToken: (userId, token, expiresAt) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
      
      db.run(sql, [userId, token, expiresAt], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  },

  // Find token by value
  findByToken: (token) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, u.email 
        FROM password_reset_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token = ? AND t.used = 0
      `;
      db.get(sql, [token], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  },

  // Mark token as used
  markAsUsed: (tokenId) => {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE password_reset_tokens SET used = 1 WHERE id = ?';
      
      db.run(sql, [tokenId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ changes: this.changes });
      });
    });
  },

  // Delete expired tokens (cleanup)
  deleteExpiredTokens: () => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM password_reset_tokens WHERE expires_at < datetime("now")';
      
      db.run(sql, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ deleted: this.changes });
      });
    });
  },

  // Invalidate all tokens for a user
  invalidateUserTokens: (userId) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM password_reset_tokens WHERE user_id = ?';
      
      db.run(sql, [userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ deleted: this.changes });
      });
    });
  }
};

// Debug functions (for testing only)
const debugDb = {
  // Get all users
  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users ORDER BY created_at DESC';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  },

  // Get all tokens with user info
  getAllTokens: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, u.email 
        FROM password_reset_tokens t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `;
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  },

  // Clear all data
  clearAllData: () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM password_reset_tokens', (err) => {
          if (err) {
            reject(err);
            return;
          }
        });
        
        db.run('DELETE FROM users', (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }
};

module.exports = {
  initializeDatabase,
  userDb,
  tokenDb,
  ...debugDb
};
