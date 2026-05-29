# Product Search API

A complete product search system with filtering and sorting using SQL. Built with Python, SQLite, and Flask.

## Features

- **Full-text search** on product names and descriptions
- **Advanced filtering** by category, brand, price range, tags, stock status
- **Multiple sort options** (price, name, date, brand, etc.)
- **Pagination support** with configurable page sizes
- **RESTful API** for easy integration
- **SQL Injection protection** through parameterized queries
- **Flexible query builder** for complex search criteria

## Project Structure

```
.
├── schema.sql           # Database schema with indexes and FTS
├── search_builder.py    # Core SQL query builder
├── api.py              # Flask REST API
├── init_db.py          # Database initialization
├── examples.py         # Usage examples
├── requirements.txt    # Python dependencies
└── README.md          # Documentation
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
python init_db.py
```

This creates a SQLite database with sample products.

### 3. Run Examples

```bash
python examples.py
```

### 4. Start API Server

```bash
python api.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Search Products
```
GET /api/products/search
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| q | string | Full-text search query | `laptop` |
| category | int/list | Category ID(s) | `1` or `1,2,3` |
| brand | string | Brand name | `Apple` |
| min_price | float | Minimum price | `50.00` |
| max_price | float | Maximum price | `200.00` |
| in_stock | boolean | Only in-stock items | `true` |
| featured | boolean | Only featured items | `true` |
| tags | string/list | Filter by tags | `wireless` or `wireless,audio` |
| sort | string | Sort field | `price`, `name`, `created_at` |
| order | string | Sort direction | `asc` or `desc` |
| page | int | Page number | `1` |
| per_page | int | Items per page (max 100) | `20` |

**Example Request:**
```bash
curl "http://localhost:5000/api/products/search?q=headphones&category=1&min_price=50&sort=price&order=desc"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Wireless Bluetooth Headphones",
        "description": "Premium noise-cancelling headphones...",
        "sku": "ELEC-001",
        "brand": "AudioTech",
        "price": 199.99,
        "compare_at_price": 249.99,
        "quantity_in_stock": 150,
        "is_active": true,
        "is_featured": true,
        "tags": ["audio", "wireless", "headphones"],
        "category_name": "Electronics",
        "discount_percent": 20.0
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 1,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

### Get Single Product
```
GET /api/products/{id}
```

### Get Available Filters
```
GET /api/products/filters
```

Returns available categories, brands, and price range for filter UI.

### Get Categories
```
GET /api/categories
```

## Using the Search Builder

The `ProductSearchBuilder` provides a fluent interface for building complex queries:

```python
from search_builder import create_search_builder

# Basic search
result = (create_search_builder()
          .with_text_search("laptop")
          .execute('products.db'))

# Advanced search with filters
result = (create_search_builder()
          .with_text_search("headphones")
          .with_categories([1, 2])
          .with_price_range(50, 500)
          .with_tags(["wireless", "audio"])
          .only_in_stock()
          .only_featured()
          .add_sort('price', 'desc')
          .add_sort('name', 'asc')
          .execute('products.db', page=1, per_page=20))

# Using custom filters
result = (create_search_builder()
          .add_filter('brand', '=', 'Apple')
          .add_filter('price', '>', 100)
          .add_filter('quantity_in_stock', '>=', 10)
          .execute('products.db'))
```

## Supported Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal | `add_filter('brand', '=', 'Apple')` |
| `!=` | Not equal | `add_filter('brand', '!=', 'Samsung')` |
| `>` | Greater than | `add_filter('price', '>', 100)` |
| `>=` | Greater or equal | `add_filter('stock', '>=', 10)` |
| `<` | Less than | `add_filter('price', '<', 500)` |
| `<=` | Less or equal | `add_filter('price', '<=', 1000)` |
| `LIKE` | Pattern match | `add_filter('name', 'LIKE', 'Pro')` |
| `IN` | In list | `add_filter('category_id', 'IN', [1, 2, 3])` |
| `NOT IN` | Not in list | `add_filter('brand', 'NOT IN', ['A', 'B'])` |
| `BETWEEN` | Range | `add_filter('price', 'BETWEEN', 50, 100)` |
| `IS NULL` | Is null | `add_filter('compare_at_price', 'IS NULL')` |
| `IS NOT NULL` | Is not null | `add_filter('compare_at_price', 'IS NOT NULL')` |

## Database Schema

The schema includes:
- **products** table with all product data
- **categories** table for hierarchical categories
- **products_fts** virtual table for full-text search (FTS5)
- **Indexes** for performance on frequently filtered fields

See `schema.sql` for complete schema definition.

## Performance Considerations

1. **Indexes** are created on all filterable fields
2. **Full-text search** uses SQLite FTS5 for efficient text matching
3. **Parameterized queries** prevent SQL injection
4. **Pagination** limits result sets to prevent memory issues
5. **JOINs** are minimized and use appropriate indexes

## Testing

Run the examples to test the functionality:

```bash
python examples.py
```

This will demonstrate:
- Basic text search
- Category filtering
- Price range filtering
- Multiple filter combinations
- Brand filtering
- Tag filtering
- Custom filter operators
- Pagination
- Featured products
- Complex multi-criteria searches

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_PATH` | Path to SQLite database | `products.db` |

## License

MIT License - Feel free to use and modify as needed.
