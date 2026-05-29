"""
Product Search API Endpoint

Flask-based REST API for product search with filtering and sorting.
"""

from flask import Flask, request, jsonify
from search_builder import ProductSearchBuilder, create_search_builder
import sqlite3
import os
from typing import Dict, Any

app = Flask(__name__)

# Configuration
DATABASE_PATH = os.environ.get('DATABASE_PATH', 'products.db')


def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/api/products/search', methods=['GET'])
def search_products():
    """
    Search products with filtering and sorting
    
    Query Parameters:
    - q: Full-text search query
    - category: Category ID(s), comma-separated for multiple
    - brand: Brand name filter
    - min_price: Minimum price
    - max_price: Maximum price
    - in_stock: Only show in-stock items (true/false)
    - featured: Only show featured items (true/false)
    - tags: Tag(s) to filter by, comma-separated
    - sort: Sort field (name, price, created_at, etc.)
    - order: Sort order (asc/desc)
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    
    Returns:
        JSON with products array and pagination info
    """
    try:
        builder = create_search_builder()
        
        # Full-text search
        query = request.args.get('q', '').strip()
        if query:
            builder.with_text_search(query)
        
        # Category filter
        categories = request.args.get('category', '')
        if categories:
            try:
                category_ids = [int(c.strip()) for c in categories.split(',') if c.strip()]
                if category_ids:
                    builder.with_categories(category_ids)
            except ValueError:
                return jsonify({'error': 'Invalid category ID format'}), 400
        
        # Brand filter
        brand = request.args.get('brand', '').strip()
        if brand:
            builder.add_filter('brand', '=', brand)
        
        # Price range
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        if min_price is not None or max_price is not None:
            builder.with_price_range(min_price, max_price)
        
        # Stock filter
        if request.args.get('in_stock', '').lower() == 'true':
            builder.only_in_stock()
        
        # Featured filter
        if request.args.get('featured', '').lower() == 'true':
            builder.only_featured()
        
        # Tags filter
        tags = request.args.get('tags', '')
        if tags:
            tag_list = [t.strip() for t in tags.split(',') if t.strip()]
            builder.with_tags(tag_list)
        
        # Sorting
        sort_field = request.args.get('sort', 'created_at')
        sort_order = request.args.get('order', 'desc')
        builder.add_sort(sort_field, sort_order)
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Execute search
        result = builder.execute(DATABASE_PATH, page=page, per_page=per_page)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id: int):
    """Get a single product by ID"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?
            """, (product_id,))
            
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': 'Product not found'}), 404
            
            product = dict(row)
            return jsonify({
                'success': True,
                'data': product
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/filters', methods=['GET'])
def get_available_filters():
    """Get available filter options (categories, brands, tags)"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get categories
            cursor.execute("SELECT id, name FROM categories ORDER BY name")
            categories = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
            
            # Get brands
            cursor.execute("""
                SELECT DISTINCT brand, COUNT(*) as count 
                FROM products 
                WHERE brand IS NOT NULL AND brand != ''
                GROUP BY brand 
                ORDER BY brand
            """)
            brands = [{'name': row[0], 'count': row[1]} for row in cursor.fetchall()]
            
            # Get price range
            cursor.execute("""
                SELECT MIN(price) as min_price, MAX(price) as max_price 
                FROM products
            """)
            row = cursor.fetchone()
            price_range = {
                'min': row[0] if row[0] else 0,
                'max': row[1] if row[1] else 0
            }
            
            return jsonify({
                'success': True,
                'data': {
                    'categories': categories,
                    'brands': brands,
                    'price_range': price_range
                }
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.*, COUNT(p.id) as product_count
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
                GROUP BY c.id
                ORDER BY c.name
            """)
            
            categories = [dict(row) for row in cursor.fetchall()]
            return jsonify({
                'success': True,
                'data': categories
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Initialize database if it doesn't exist
    if not os.path.exists(DATABASE_PATH):
        print(f"Database not found at {DATABASE_PATH}")
        print("Please run: python init_db.py")
    else:
        print(f"Starting API server with database: {DATABASE_PATH}")
        app.run(debug=True, host='0.0.0.0', port=5000)
