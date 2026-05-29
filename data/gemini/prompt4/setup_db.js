const Database = require('better-sqlite3');
const db = new Database('database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price REAL,
    rating REAL,
    stock INTEGER,
    image_url TEXT
  )
`);

const products = [
  { name: 'Quantum Processor', description: 'Next-gen computing power with ultra-low latency.', category: 'Electronics', price: 1299.99, rating: 4.9, stock: 15, image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500' },
  { name: 'Aurora Keyboard', description: 'Mechanical keyboard with customizable RGB and tactile switches.', category: 'Electronics', price: 159.50, rating: 4.7, stock: 50, image_url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500' },
  { name: 'Nexus Smartphone', description: 'Sleek design with a folding display and pro-grade camera.', category: 'Electronics', price: 1099.00, rating: 4.8, stock: 25, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500' },
  { name: 'Cyberpunk Jacket', description: 'Tech-wear inspired waterproof jacket with neon highlights.', category: 'Fashion', price: 189.00, rating: 4.5, stock: 30, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' },
  { name: 'Lunar Sneakers', description: 'Lightweight running shoes with moon-bounce cushioning.', category: 'Fashion', price: 120.00, rating: 4.6, stock: 100, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' },
  { name: 'Bio-Organic Desk', description: 'Sustainable wood desk with built-in wireless charging.', category: 'Home', price: 450.00, rating: 4.4, stock: 10, image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500' },
  { name: 'Zenith Headphones', description: 'Noise-canceling headphones with spatial audio technology.', category: 'Electronics', price: 349.99, rating: 4.9, stock: 40, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
  { name: 'Nebula Coffee Maker', description: 'Smart coffee maker that brews the perfect cup every time.', category: 'Home', price: 89.99, rating: 4.2, stock: 60, image_url: 'https://images.unsplash.com/photo-1520970014086-2208d157c9e2?w=500' },
  { name: 'Gravity Backpack', description: 'Ergonomic backpack with solar panels and anti-theft locks.', category: 'Fashion', price: 145.00, rating: 4.7, stock: 45, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500' },
  { name: 'Solaris Smart Watch', description: 'Health tracking watch with 30-day battery life.', category: 'Electronics', price: 299.00, rating: 4.5, stock: 75, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' }
];

const insert = db.prepare('INSERT INTO products (name, description, category, price, rating, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');

const insertMany = db.transaction((products) => {
  for (const product of products) {
    insert.run(product.name, product.description, product.category, product.price, product.rating, product.stock, product.image_url);
  }
});

insertMany(products);

console.log('Database initialized with sample products.');
db.close();
