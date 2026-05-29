const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    rating REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insert = db.prepare(
  'INSERT INTO products (name, description, category, price, rating, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

const existing = db.prepare('SELECT COUNT(*) AS count FROM products').get();
if (existing.count > 0) {
  console.log('Products table already seeded.');
  db.close();
  process.exit(0);
}

const products = [
  ['Quantum Processor', 'Next-gen computing power with ultra-low latency.', 'Electronics', 1299.99, 4.9, 15, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500'],
  ['Aurora Keyboard', 'Mechanical keyboard with customizable RGB and tactile switches.', 'Electronics', 159.50, 4.7, 50, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500'],
  ['Nexus Smartphone', 'Sleek design with a folding display and pro-grade camera.', 'Electronics', 1099.00, 4.8, 25, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'],
  ['Cyberpunk Jacket', 'Tech-wear inspired waterproof jacket with neon highlights.', 'Fashion', 189.00, 4.5, 30, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
  ['Lunar Sneakers', 'Lightweight running shoes with moon-bounce cushioning.', 'Fashion', 120.00, 4.6, 100, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
  ['Bio-Organic Desk', 'Sustainable wood desk with built-in wireless charging.', 'Home', 450.00, 4.4, 10, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500'],
  ['Zenith Headphones', 'Noise-canceling headphones with spatial audio technology.', 'Electronics', 349.99, 4.9, 40, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
  ['Nebula Coffee Maker', 'Smart coffee maker that brews the perfect cup every time.', 'Home', 89.99, 4.2, 60, 'https://images.unsplash.com/photo-1520970014086-2208d157c9e2?w=500'],
  ['Gravity Backpack', 'Ergonomic backpack with solar panels and anti-theft locks.', 'Fashion', 145.00, 4.7, 45, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
  ['Solaris Smart Watch', 'Health tracking watch with 30-day battery life.', 'Electronics', 299.00, 4.5, 75, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500']
];

const insertMany = db.transaction((items) => {
  for (const p of items) {
    insert.run(...p);
  }
});

insertMany(products);
console.log('Database seeded with 10 sample products.');
db.close();
