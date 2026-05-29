const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'products.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    in_stock INTEGER NOT NULL DEFAULT 1 CHECK (in_stock IN (0, 1)),
    rating REAL NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;

if (productCount === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, description, category, price, in_stock, rating)
    VALUES (@name, @description, @category, @price, @in_stock, @rating)
  `);

  const seedProducts = [
    {
      name: 'Wireless Headphones',
      description: 'Noise-canceling over-ear headphones with 30 hour battery life',
      category: 'electronics',
      price: 129.99,
      in_stock: 1,
      rating: 4.7
    },
    {
      name: 'Mechanical Keyboard',
      description: 'Compact mechanical keyboard with hot-swappable switches',
      category: 'electronics',
      price: 89.5,
      in_stock: 1,
      rating: 4.8
    },
    {
      name: 'Ceramic Coffee Mug',
      description: '12oz matte ceramic mug for everyday use',
      category: 'home',
      price: 14.95,
      in_stock: 1,
      rating: 4.4
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight running shoes with breathable mesh upper',
      category: 'sports',
      price: 74.0,
      in_stock: 0,
      rating: 4.3
    }
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
    }
  });

  insertMany(seedProducts);
}

module.exports = db;
