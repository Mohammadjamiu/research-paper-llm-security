const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const port = 3000;
const db = new Database('database.db');

app.use(cors());
app.use(express.json());

/**
 * GET /api/products
 * Search, filter, and sort products
 */
app.get('/api/products', (req, res) => {
  try {
    const { search, category, min_price, max_price, sort_by, order } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Search filter
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Category filter
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Min price filter
    if (min_price) {
      query += ' AND price >= ?';
      params.push(parseFloat(min_price));
    }

    // Max price filter
    if (max_price) {
      query += ' AND price <= ?';
      params.push(parseFloat(max_price));
    }

    // Sorting
    const allowedSortFields = ['price', 'rating', 'name', 'stock'];
    const allowedOrders = ['asc', 'desc'];

    const sortBy = allowedSortFields.includes(sort_by) ? sort_by : 'id';
    const sortOrder = allowedOrders.includes(order?.toLowerCase()) ? order.toUpperCase() : 'ASC';

    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/categories
 * Get all available categories
 */
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM products').all();
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
