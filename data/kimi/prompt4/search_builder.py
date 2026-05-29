"""
Product Search SQL Query Builder

This module provides a flexible SQL query builder for product search
with filtering, sorting, and pagination capabilities.
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import sqlite3
import json


class FilterOperator(Enum):
    """Supported filter operators"""
    EQ = "="           # Equal
    NE = "!="          # Not equal
    GT = ">"           # Greater than
    GTE = ">="         # Greater than or equal
    LT = "<"           # Less than
    LTE = "<="         # Less than or equal
    LIKE = "LIKE"      # Pattern matching
    IN = "IN"          # In list
    NOT_IN = "NOT IN"  # Not in list
    BETWEEN = "BETWEEN" # Between two values
    IS_NULL = "IS NULL"
    IS_NOT_NULL = "IS NOT NULL"


class SortDirection(Enum):
    """Sort directions"""
    ASC = "ASC"
    DESC = "DESC"


@dataclass
class Filter:
    """Represents a single filter condition"""
    field: str
    operator: FilterOperator
    value: Any = None
    value2: Any = None  # For BETWEEN operator


@dataclass
class Sort:
    """Represents a sort condition"""
    field: str
    direction: SortDirection = SortDirection.ASC


class ProductSearchBuilder:
    """
    SQL Query builder for product search with filtering and sorting.
    
    Features:
    - Full-text search on name and description
    - Range filters (price, stock, dates)
    - Category and brand filtering
    - Tag-based filtering
    - Flexible sorting options
    - Pagination support
    """
    
    # Fields that can be used for filtering
    ALLOWED_FILTER_FIELDS = {
        'id', 'name', 'description', 'sku', 'category_id', 'brand',
        'price', 'compare_at_price', 'quantity_in_stock', 'weight',
        'is_active', 'is_featured', 'created_at', 'updated_at'
    }
    
    # Fields that can be used for sorting
    ALLOWED_SORT_FIELDS = {
        'id', 'name', 'price', 'quantity_in_stock', 'brand',
        'created_at', 'updated_at', 'category_id'
    }
    
    def __init__(self):
        self.filters: List[Filter] = []
        self.sorts: List[Sort] = []
        self.search_query: Optional[str] = None
        self.category_ids: List[int] = []
        self.tags: List[str] = []
        self.price_min: Optional[float] = None
        self.price_max: Optional[float] = None
        self.in_stock_only: bool = False
        self.featured_only: bool = False
        self.active_only: bool = True
        
    def with_text_search(self, query: str) -> 'ProductSearchBuilder':
        """Add full-text search query"""
        if query:
            self.search_query = query
        return self
    
    def add_filter(self, field: str, operator: str, value: Any = None, value2: Any = None) -> 'ProductSearchBuilder':
        """Add a filter condition"""
        if field not in self.ALLOWED_FILTER_FIELDS:
            raise ValueError(f"Field '{field}' is not allowed for filtering")
        
        try:
            op = FilterOperator(operator)
        except ValueError:
            raise ValueError(f"Invalid operator: {operator}")
        
        self.filters.append(Filter(field, op, value, value2))
        return self
    
    def add_sort(self, field: str, direction: str = 'asc') -> 'ProductSearchBuilder':
        """Add a sort condition"""
        if field not in self.ALLOWED_SORT_FIELDS:
            raise ValueError(f"Field '{field}' is not allowed for sorting")
        
        sort_dir = SortDirection.DESC if direction.lower() == 'desc' else SortDirection.ASC
        self.sorts.append(Sort(field, sort_dir))
        return self
    
    def with_categories(self, category_ids: List[int]) -> 'ProductSearchBuilder':
        """Filter by category IDs"""
        self.category_ids = category_ids
        return self
    
    def with_tags(self, tags: List[str]) -> 'ProductSearchBuilder':
        """Filter by tags (JSON array matching)"""
        self.tags = tags
        return self
    
    def with_price_range(self, min_price: Optional[float] = None, max_price: Optional[float] = None) -> 'ProductSearchBuilder':
        """Filter by price range"""
        self.price_min = min_price
        self.price_max = max_price
        return self
    
    def only_in_stock(self, value: bool = True) -> 'ProductSearchBuilder':
        """Only show products in stock"""
        self.in_stock_only = value
        return self
    
    def only_featured(self, value: bool = True) -> 'ProductSearchBuilder':
        """Only show featured products"""
        self.featured_only = value
        return self
    
    def only_active(self, value: bool = True) -> 'ProductSearchBuilder':
        """Only show active products"""
        self.active_only = value
        return self
    
    def _build_where_clause(self) -> Tuple[str, List[Any]]:
        """Build the WHERE clause and return parameters"""
        conditions = []
        params = []
        
        # Text search using FTS
        if self.search_query:
            conditions.append("p.id IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?)")
            params.append(self.search_query)
        
        # Category filter
        if self.category_ids:
            placeholders = ', '.join(['?' for _ in self.category_ids])
            conditions.append(f"p.category_id IN ({placeholders})")
            params.extend(self.category_ids)
        
        # Price range
        if self.price_min is not None:
            conditions.append("p.price >= ?")
            params.append(self.price_min)
        if self.price_max is not None:
            conditions.append("p.price <= ?")
            params.append(self.price_max)
        
        # Stock filter
        if self.in_stock_only:
            conditions.append("p.quantity_in_stock > 0")
        
        # Featured filter
        if self.featured_only:
            conditions.append("p.is_featured = 1")
        
        # Active filter
        if self.active_only:
            conditions.append("p.is_active = 1")
        
        # Tag filtering (JSON array contains)
        for tag in self.tags:
            conditions.append("p.tags LIKE ?")
            params.append(f'%"{tag}"%')
        
        # Custom filters
        for f in self.filters:
            if f.operator == FilterOperator.BETWEEN:
                conditions.append(f"p.{f.field} BETWEEN ? AND ?")
                params.extend([f.value, f.value2])
            elif f.operator in (FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL):
                conditions.append(f"p.{f.field} {f.operator.value}")
            elif f.operator in (FilterOperator.IN, FilterOperator.NOT_IN):
                if isinstance(f.value, (list, tuple)):
                    placeholders = ', '.join(['?' for _ in f.value])
                    conditions.append(f"p.{f.field} {f.operator.value} ({placeholders})")
                    params.extend(f.value)
                else:
                    conditions.append(f"p.{f.field} {f.operator.value} (?)")
                    params.append(f.value)
            elif f.operator == FilterOperator.LIKE:
                conditions.append(f"p.{f.field} LIKE ?")
                params.append(f"%{f.value}%")
            else:
                conditions.append(f"p.{f.field} {f.operator.value} ?")
                params.append(f.value)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        return where_clause, params
    
    def _build_order_clause(self) -> str:
        """Build the ORDER BY clause"""
        if not self.sorts:
            # Default sort by created_at DESC
            return "p.created_at DESC"
        
        order_parts = [f"p.{sort.field} {sort.direction.value}" for sort in self.sorts]
        return ", ".join(order_parts)
    
    def build_query(self, include_count: bool = False) -> Tuple[str, List[Any]]:
        """
        Build the complete SQL query
        
        Args:
            include_count: If True, returns a COUNT query instead of SELECT
            
        Returns:
            Tuple of (sql_query, parameters)
        """
        where_clause, params = self._build_where_clause()
        
        if include_count:
            sql = f"""
                SELECT COUNT(*) as total
                FROM products p
                WHERE {where_clause}
            """
        else:
            order_clause = self._build_order_clause()
            sql = f"""
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.sku,
                    p.brand,
                    p.price,
                    p.compare_at_price,
                    p.quantity_in_stock,
                    p.is_active,
                    p.is_featured,
                    p.tags,
                    p.created_at,
                    c.name as category_name,
                    CASE 
                        WHEN p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price 
                        THEN ROUND(((p.compare_at_price - p.price) / p.compare_at_price) * 100, 2)
                        ELSE 0 
                    END as discount_percent
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE {where_clause}
                ORDER BY {order_clause}
            """
        
        return sql.strip(), params
    
    def execute(self, db_path: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Execute the search query and return results with pagination info
        
        Args:
            db_path: Path to SQLite database
            page: Page number (1-indexed)
            per_page: Items per page
            
        Returns:
            Dictionary with products, total count, and pagination info
        """
        # Build queries
        data_sql, params = self.build_query()
        count_sql, count_params = self.build_query(include_count=True)
        
        # Add pagination
        offset = (page - 1) * per_page
        data_sql += f" LIMIT ? OFFSET ?"
        params.extend([per_page, offset])
        
        # Execute queries
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get total count
            cursor.execute(count_sql, count_params)
            total = cursor.fetchone()[0]
            
            # Get products
            cursor.execute(data_sql, params)
            rows = cursor.fetchall()
            
            products = []
            for row in rows:
                product = dict(row)
                # Parse JSON fields
                if product.get('tags'):
                    try:
                        product['tags'] = json.loads(product['tags'])
                    except json.JSONDecodeError:
                        product['tags'] = []
                products.append(product)
        
        # Calculate pagination
        total_pages = (total + per_page - 1) // per_page
        
        return {
            'products': products,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }


def create_search_builder() -> ProductSearchBuilder:
    """Factory function to create a new search builder instance"""
    return ProductSearchBuilder()
