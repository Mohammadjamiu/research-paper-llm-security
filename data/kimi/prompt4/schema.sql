-- Database schema for products table
-- This schema supports a comprehensive product search system

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id INTEGER,
    brand VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    quantity_in_stock INTEGER DEFAULT 0,
    weight DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT, -- JSON array of tags
    attributes TEXT, -- JSON object for flexible attributes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create categories table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER,
    slug VARCHAR(100) UNIQUE NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Indexes for performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_sku ON products(sku);

-- Full-text search index (for SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    name, 
    description,
    content='products',
    content_rowid='id'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products
BEGIN
    INSERT INTO products_fts(rowid, name, description)
    VALUES (new.id, new.name, new.description);
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products
BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description)
    VALUES ('delete', old.id, old.name, old.description);
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products
BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description)
    VALUES ('delete', old.id, old.name, old.description);
    INSERT INTO products_fts(rowid, name, description)
    VALUES (new.id, new.name, new.description);
END;

-- Sample data
INSERT INTO categories (name, slug) VALUES 
    ('Electronics', 'electronics'),
    ('Clothing', 'clothing'),
    ('Home & Garden', 'home-garden'),
    ('Sports', 'sports'),
    ('Books', 'books');

INSERT INTO products (name, description, sku, category_id, brand, price, compare_at_price, quantity_in_stock, is_active, is_featured, tags) VALUES
    ('Wireless Bluetooth Headphones', 'Premium noise-cancelling headphones with 30-hour battery life', 'ELEC-001', 1, 'AudioTech', 199.99, 249.99, 150, 1, 1, '["audio", "wireless", "headphones"]'),
    ('Smart Watch Pro', 'Advanced fitness tracking and health monitoring', 'ELEC-002', 1, 'TechGear', 299.99, 349.99, 89, 1, 1, '["wearable", "fitness", "smart"]'),
    ('Cotton T-Shirt', 'Comfortable 100% organic cotton t-shirt', 'CLTH-001', 2, 'EcoWear', 29.99, NULL, 500, 1, 0, '["clothing", "organic", "casual"]'),
    ('Running Shoes', 'Lightweight running shoes with cushioned sole', 'SPORT-001', 4, 'SpeedRun', 89.99, 119.99, 200, 1, 1, '["footwear", "running", "athletic"]'),
    ('Garden Tool Set', '5-piece stainless steel garden tool set', 'HOME-001', 3, 'GardenPro', 45.99, NULL, 75, 1, 0, '["garden", "tools", "outdoor"]'),
    ('Programming Python', 'Comprehensive guide to Python programming', 'BOOK-001', 5, 'TechBooks', 49.99, NULL, 100, 1, 0, '["programming", "python", "education"]'),
    ('Laptop Stand', 'Ergonomic aluminum laptop stand', 'ELEC-003', 1, 'WorkSpace', 79.99, 99.99, 45, 1, 0, '["accessories", "ergonomic", "office"]'),
    ('Winter Jacket', 'Waterproof insulated winter jacket', 'CLTH-002', 2, 'ArcticWear', 149.99, 199.99, 60, 1, 1, '["clothing", "winter", "outdoor"]');
