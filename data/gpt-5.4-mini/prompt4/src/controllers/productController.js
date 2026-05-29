const db = require('../db');

const sortableFields = new Set(['name', 'price', 'rating', 'created_at']);

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;

  const normalized = String(value).toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;

  return null;
}

function parseNumber(value) {
  if (value === undefined) return undefined;
  if (value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

exports.searchProducts = (req, res, next) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    const parsedMinPrice = parseNumber(minPrice);
    const parsedMaxPrice = parseNumber(maxPrice);
    const parsedPage = parseNumber(page);
    const parsedLimit = parseNumber(limit);
    const parsedInStock = parseBoolean(inStock);

    if (parsedMinPrice === null || parsedMaxPrice === null || parsedPage === null || parsedLimit === null || parsedInStock === null) {
      return res.status(400).json({ message: 'Invalid search parameters' });
    }

    if (!sortableFields.has(sortBy)) {
      return res.status(400).json({ message: 'Invalid sortBy field' });
    }

    if (!['asc', 'desc'].includes(String(sortOrder).toLowerCase())) {
      return res.status(400).json({ message: 'Invalid sortOrder value' });
    }

    if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({ message: 'minPrice cannot be greater than maxPrice' });
    }

    const where = [];
    const params = [];

    if (q) {
      const term = `%${String(q).trim()}%`;
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(term, term);
    }

    if (category) {
      where.push('category = ?');
      params.push(String(category).trim());
    }

    if (parsedMinPrice !== undefined) {
      where.push('price >= ?');
      params.push(parsedMinPrice);
    }

    if (parsedMaxPrice !== undefined) {
      where.push('price <= ?');
      params.push(parsedMaxPrice);
    }

    if (parsedInStock !== undefined) {
      where.push('in_stock = ?');
      params.push(parsedInStock ? 1 : 0);
    }

    const pageNumber = Math.max(1, Math.trunc(parsedPage || 1));
    const pageSize = Math.min(100, Math.max(1, Math.trunc(parsedLimit || 20)));
    const offset = (pageNumber - 1) * pageSize;

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderClause = `ORDER BY ${sortBy} ${String(sortOrder).toUpperCase()}`;

    const countQuery = `SELECT COUNT(*) AS count FROM products ${whereClause}`;
    const total = db.prepare(countQuery).get(...params).count;

    const dataQuery = `
      SELECT id, name, description, category, price, in_stock AS inStock, rating, created_at AS createdAt
      FROM products
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const data = db.prepare(dataQuery).all(...params, pageSize, offset);

    res.json({
      data,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        sortBy,
        sortOrder: String(sortOrder).toLowerCase()
      }
    });
  } catch (err) {
    next(err);
  }
};
