"""
Create application role with proper RLS enforcement
sma_admin (table owner) bypasses RLS even with FORCE
We need an app_user role for the application to use
"""
import psycopg2

db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

print("=" * 70)
print("🔧 RLS FIX: Creating application user role")
print("=" * 70)

try:
    # Check if app_user exists
    cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'app_user'")
    if cur.fetchone():
        print("\n✅ app_user role already exists")
    else:
        print("\n📝 Creating app_user role...")
        cur.execute("CREATE ROLE app_user WITH LOGIN PASSWORD 'appuser_password'")
        print("   ✅ app_user role created")
    
    # Grant necessary permissions
    print("\n📝 Granting permissions to app_user...")
    tables = ['users', 'prescriptions', 'reminders', 'appointments', 'medicine_history', 'qa_history', 'hospital_report_history', 'reminder_history', 'dashboard_data']
    
    for table in tables:
        try:
            cur.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON {table} TO app_user")
            print(f"   ✅ Granted permissions on {table}")
        except Exception as e:
            print(f"   ⚠️  {table}: {e}")
    
    # Grant usage on sequences
    cur.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user")
    print("   ✅ Granted sequence permissions")
    
    print("\n" + "=" * 70)
    print("✅ SOLUTION:")
    print("=" * 70)
    print("\n⚠️  IMPORTANT: Table owner (sma_admin) ALWAYS bypasses RLS!")
    print("   This is PostgreSQL design - even FORCE RLS doesn't apply to owners.")
    print("\n💡 TWO OPTIONS:")
    print("\n   Option 1: Use app_user role in application")
    print("   Update DATABASE_URL to:")
    print("   postgresql://app_user:appuser_password@host:5432/db")
    print("\n   Option 2: Accept that sma_admin bypasses RLS (admin privileges)")
    print("   RLS will work for all other users/roles")
    print("\n   For production: Use app_user")
    print("   For development/testing with sma_admin: Add manual user_id filtering")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    conn.close()
