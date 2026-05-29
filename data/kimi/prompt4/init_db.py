"""
Database initialization script
"""

import sqlite3
import os

DATABASE_PATH = 'products.db'
SCHEMA_PATH = 'schema.sql'


def init_database():
    """Initialize the database with schema and sample data"""
    # Remove existing database
    if os.path.exists(DATABASE_PATH):
        os.remove(DATABASE_PATH)
        print(f"Removed existing database: {DATABASE_PATH}")
    
    # Read schema
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
    
    # Create database and execute schema
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Execute schema using executescript which properly handles multiple statements
    try:
        cursor.executescript(schema)
        conn.commit()
    except sqlite3.Error as e:
        print(f"Error executing schema: {e}")
    finally:
        conn.close()
    
    print(f"Database initialized successfully: {DATABASE_PATH}")


if __name__ == '__main__':
    init_database()
