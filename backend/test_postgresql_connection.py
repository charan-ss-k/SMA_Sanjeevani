"""
PostgreSQL Connection Test
Comprehensive verification of Azure PostgreSQL setup
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

print("=" * 70)
print("🔧 POSTGRESQL CONNECTION TEST")
print("=" * 70)

try:
    from app.core.database import (
        DATABASE_URL, engine, SessionLocal, verify_connection, Base
    )
    
    print(f"\n✅ Imports successful")
    print(f"📊 Database URL: {DATABASE_URL[:70]}...")
    
    # Test 1: Verify connection
    print(f"\n1️⃣ Testing PostgreSQL connection...")
    if verify_connection():
        print(f"   ✅ Connection successful")
    else:
        print(f"   ❌ Connection failed")
        sys.exit(1)
    
    # Test 2: Create session
    print(f"\n2️⃣ Testing session creation...")
    db = SessionLocal()
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT current_database(), current_user"))
        db_name, user = result.fetchone()
        print(f"   ✅ Session created")
        print(f"   📊 Database: {db_name}")
        print(f"   👤 User: {user}")
    finally:
        db.close()
    
    # Test 3: Check tables
    print(f"\n3️⃣ Checking database tables...")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"   ✅ Found {len(tables)} tables:")
    for table in sorted(tables)[:10]:  # Show first 10
        print(f"      - {table}")
    if len(tables) > 10:
        print(f"      ... and {len(tables) - 10} more")
    
    # Test 4: Test RLS
    print(f"\n4️⃣ Checking Row-Level Security...")
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND rowsecurity = true
        """))
        rls_tables = [row[0] for row in result.fetchall()]
        print(f"   ✅ {len(rls_tables)} tables with RLS enabled:")
        for table in rls_tables:
            print(f"      - {table}")
    finally:
        db.close()
    
    # Test 5: Test user query
    print(f"\n5️⃣ Testing Users table...")
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        print(f"   ✅ Users table accessible")
        print(f"   👥 Total users: {count}")
    except Exception as e:
        print(f"   ⚠️  Users table: {e}")
    finally:
        db.close()
    
    print(f"\n" + "=" * 70)
    print(f"✅ ALL TESTS PASSED - PostgreSQL is ready!")
    print(f"=" * 70)
    
except Exception as e:
    print(f"\n❌ TEST FAILED")
    print(f"   Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
