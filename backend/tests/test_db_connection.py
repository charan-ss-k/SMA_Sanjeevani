"""
Test PostgreSQL connection to sanjeevani_finaldb
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, inspect, text
from database import DATABASE_URL

try:
    print("=" * 60)
    print("PostgreSQL Connection Test")
    print("=" * 60)
    print(f"\nDatabase URL: {DATABASE_URL}")
    
    # Create engine
    engine = create_engine(DATABASE_URL, echo=False)
    
    # Test connection
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"\n✓ Connected to PostgreSQL")
        print(f"  Version: {version[:50]}...")
        
        # Get database info
        result = connection.execute(text("SELECT current_database(), current_user;"))
        db_name, db_user = result.fetchone()
        print(f"\n✓ Database: {db_name}")
        print(f"  User: {db_user}")
        
        # List all tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n✓ Found {len(tables)} tables:")
        for table in sorted(tables):
            print(f"  - {table}")
        
        # Count records in each table
        print(f"\n✓ Record counts:")
        for table in sorted(tables):
            result = connection.execute(text(f"SELECT COUNT(*) FROM {table};"))
            count = result.fetchone()[0]
            print(f"  - {table}: {count} records")
    
    print("\n" + "=" * 60)
    print("✓ All connection tests passed!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n✗ Connection failed: {e}")
    print(f"  Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
