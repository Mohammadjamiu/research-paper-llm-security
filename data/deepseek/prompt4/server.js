const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'database.db'));

db.pragma('journal_mode = WAL');

app.use(cors());
app.use(express.json());

const allowedSortFields = ['name', 'price', 'rating', 'stock', 'created_at'];
const allowedOrders = ['asc', 'desc'];

function validateSortField(field) {
  return allowedSortFields.includes(field) ? field : 'id';
}

function validateOrder(order) {
  return allowedOrders.includes(order?.toLowerCase()) ? order.toUpperCase() : 'ASC';
}

function buildProductQuery(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.category) {
    const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
    const placeholders = categories.map(() => '?').join(',');
    conditions.push(`category IN (${placeholders})`);
    params.push(...categories);
  }

  if (filters.min_price !== undefined) {
    conditions.push('price >= ?');
    params.push(Number(filters.min_price));
  }

  if (filters.max_price !== undefined) {
    conditions.push('price <= ?');
    params.push(Number(filters.max_price));
  }

  if (filters.min_rating !== undefined) {
    conditions.push('rating >= ?');
    params.push(Number(filters.min_rating));
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const orderClause = `ORDER BY ${validateSortField(filters.sort_by)} ${validateOrder(filters.order)}`;

  return { where, orderClause, params };
}

app.get('/api/products', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page, 10) || 20));
    const offset = (page - 1) * perPage;

    const { where, orderClause, params } = buildProductQuery(req.query);

    const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM products ${where}`);
    const { total } = countStmt.get(...params);

    const dataStmt = db.prepare(
      `SELECT * FROM products ${where} ${orderClause} LIMIT ? OFFSET ?`
    );
    const products = dataStmt.all(...params, perPage, offset);

    res.json({
      data: products,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
        has_next: page * perPage < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category'
    ).all();
    res.json(rows);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
