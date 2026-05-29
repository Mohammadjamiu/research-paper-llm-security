"""
Product Search Examples

Demonstrates various ways to use the ProductSearchBuilder
"""

from search_builder import create_search_builder, ProductSearchBuilder, FilterOperator
import json


def example_basic_search(db_path: str = 'products.db'):
    """Basic search with text query"""
    print("\n=== Basic Text Search ===")
    
    result = (create_search_builder()
              .with_text_search("headphones")
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} products")
    for product in result['products']:
        print(f"  - {product['name']} (${product['price']})")


def example_category_filter(db_path: str = 'products.db'):
    """Filter by category"""
    print("\n=== Category Filter ===")
    
    result = (create_search_builder()
              .with_categories([1])  # Electronics
              .add_sort('price', 'desc')
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} electronics products")
    for product in result['products']:
        print(f"  - {product['name']} (${product['price']})")


def example_price_range(db_path: str = 'products.db'):
    """Filter by price range"""
    print("\n=== Price Range Filter ===")
    
    result = (create_search_builder()
              .with_price_range(min_price=50, max_price=200)
              .add_sort('price', 'asc')
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} products between $50-$200")
    for product in result['products']:
        discount = product.get('discount_percent', 0)
        discount_str = f" (Save {discount}%)" if discount > 0 else ""
        print(f"  - {product['name']} (${product['price']}){discount_str}")


def example_multiple_filters(db_path: str = 'products.db'):
    """Combine multiple filters"""
    print("\n=== Multiple Filters ===")
    
    result = (create_search_builder()
              .with_categories([1, 2])  # Electronics or Clothing
              .with_price_range(max_price=150)
              .only_in_stock()
              .only_active()
              .add_sort('created_at', 'desc')
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} active in-stock products")
    for product in result['products']:
        print(f"  - {product['name']} - Stock: {product['quantity_in_stock']}")


def example_brand_filter(db_path: str = 'products.db'):
    """Filter by brand"""
    print("\n=== Brand Filter ===")
    
    result = (create_search_builder()
              .add_filter('brand', '=', 'AudioTech')
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} AudioTech products")
    for product in result['products']:
        print(f"  - {product['name']}")


def example_tag_filter(db_path: str = 'products.db'):
    """Filter by tags"""
    print("\n=== Tag Filter ===")
    
    result = (create_search_builder()
              .with_tags(['wireless', 'headphones'])
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} products with tags")
    for product in result['products']:
        tags = ', '.join(product.get('tags', []))
        print(f"  - {product['name']} [Tags: {tags}]")


def example_custom_filters(db_path: str = 'products.db'):
    """Using custom filter operators"""
    print("\n=== Custom Filter Operators ===")
    
    # Products with price greater than 100
    result = (create_search_builder()
              .add_filter('price', '>', 100)
              .add_sort('price', 'desc')
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} products > $100")
    for product in result['products']:
        print(f"  - {product['name']} (${product['price']})")
    
    # Products with name containing specific text
    result2 = (create_search_builder()
               .add_filter('name', 'LIKE', 'Pro')
               .execute(db_path))
    
    print(f"\nFound {result2['pagination']['total']} products with 'Pro' in name")
    for product in result2['products']:
        print(f"  - {product['name']}")


def example_pagination(db_path: str = 'products.db'):
    """Demonstrate pagination"""
    print("\n=== Pagination Example ===")
    
    # Get page 1 with 3 items per page
    result = (create_search_builder()
              .execute(db_path, page=1, per_page=3))
    
    print(f"Page 1 of {result['pagination']['total_pages']}")
    print(f"Showing {len(result['products'])} of {result['pagination']['total']} products")
    for product in result['products']:
        print(f"  - {product['name']}")
    
    # Get page 2
    result2 = (create_search_builder()
               .execute(db_path, page=2, per_page=3))
    
    print(f"\nPage 2 of {result2['pagination']['total_pages']}")
    for product in result2['products']:
        print(f"  - {product['name']}")


def example_featured_products(db_path: str = 'products.db'):
    """Get featured products"""
    print("\n=== Featured Products ===")
    
    result = (create_search_builder()
              .only_featured()
              .add_sort('price', 'desc')
              .execute(db_path))
    
    print(f"Found {result['pagination']['total']} featured products")
    for product in result['products']:
        print(f"  [STAR] {product['name']} (${product['price']})")


def example_complex_search(db_path: str = 'products.db'):
    """Complex search with multiple criteria"""
    print("\n=== Complex Search ===")
    
    result = (create_search_builder()
              .with_text_search("smart")
              .with_categories([1])  # Electronics
              .with_price_range(100, 500)
              .only_in_stock()
              .only_featured()
              .add_sort('price', 'desc')
              .add_sort('name', 'asc')
              .execute(db_path, page=1, per_page=10))
    
    print(f"Search: 'smart' electronics, $100-$500, featured, in-stock")
    print(f"Found {result['pagination']['total']} products")
    for product in result['products']:
        print(f"  - {product['name']} (${product['price']}) - {product['category_name']}")


def print_raw_sql_example():
    """Show generated SQL for debugging"""
    print("\n=== Generated SQL Example ===")
    
    builder = (create_search_builder()
               .with_text_search("laptop")
               .with_categories([1])
               .with_price_range(50, 500)
               .add_sort('price', 'desc'))
    
    sql, params = builder.build_query()
    print("SQL Query:")
    print(sql)
    print(f"\nParameters: {params}")
    
    # Count query
    count_sql, count_params = builder.build_query(include_count=True)
    print("\nCount Query:")
    print(count_sql)
    print(f"\nParameters: {count_params}")


def run_all_examples():
    """Run all examples"""
    import os
    
    db_path = 'products.db'
    
    # Check if database exists
    if not os.path.exists(db_path):
        print(f"Database not found. Running init_db.py...")
        import init_db
        init_db.init_database()
    
    print("=" * 60)
    print("PRODUCT SEARCH EXAMPLES")
    print("=" * 60)
    
    try:
        example_basic_search(db_path)
        example_category_filter(db_path)
        example_price_range(db_path)
        example_multiple_filters(db_path)
        example_brand_filter(db_path)
        example_tag_filter(db_path)
        example_custom_filters(db_path)
        example_pagination(db_path)
        example_featured_products(db_path)
        example_complex_search(db_path)
        print_raw_sql_example()
    except Exception as e:
        print(f"Error running examples: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)


if __name__ == '__main__':
    run_all_examples()
