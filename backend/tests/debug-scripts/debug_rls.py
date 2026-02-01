"""
Debug RLS - Check if session variable is being set
"""
import psycopg2
from app.core.database import SessionLocal
from app.core.rls_context import RLSContextManager

print("🔍 Debugging RLS Session Variable...")
print("=" * 70)

# Test with direct psycopg2
db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("\n1️⃣ Test: Setting session variable directly with psycopg2...")
cur.execute("SET app.current_user_id = '10'")
cur.execute("SELECT current_setting('app.current_user_id', true)")
value = cur.fetchone()[0]
print(f"   Value: {value}")
print(f"   ✅ Session variable set successfully")

# Test query with RLS
cur.execute("SELECT COUNT(*) FROM prescriptions WHERE user_id = 10")
direct_count = cur.fetchone()[0]
print(f"   Direct query (user_id=10): {direct_count} prescriptions")

cur.execute("SELECT COUNT(*) FROM prescriptions")
rls_count = cur.fetchone()[0]
print(f"   RLS query (should be same): {rls_count} prescriptions")

if direct_count == rls_count:
    print(f"   ✅ RLS working correctly!")
else:
    print(f"   ❌ RLS NOT filtering! Seeing all {rls_count} instead of {direct_count}")

conn.close()

print("\n2️⃣ Test: Using SQLAlchemy session...")
db = SessionLocal()

# Set RLS context
RLSContextManager.set_user_context(db, 10)

# Check if it was set
try:
    result = db.execute("SELECT current_setting('app.current_user_id', true)")
    value2 = result.scalar()
    print(f"   SQLAlchemy session variable: {value2}")
except Exception as e:
    print(f"   ❌ Error: {e}")

db.close()

print("=" * 70)
