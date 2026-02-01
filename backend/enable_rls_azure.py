"""
Deploy RLS Policies to Azure PostgreSQL
This script ONLY enables RLS and creates policies on existing tables.
"""
import psycopg2
from psycopg2 import sql

db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

print("=" * 70)
print("🔒 ENABLING ROW-LEVEL SECURITY (RLS) ON AZURE POSTGRESQL")
print("=" * 70)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("\n✅ Connected to Azure PostgreSQL")
    
    # List of user-scoped tables that need RLS
    tables = [
        'appointments',
        'dashboard_data',
        'hospital_report_history',
        'medicine_history',
        'prescriptions',
        'qa_history',
        'reminder_history',
        'reminders'
    ]
    
    print(f"\n📋 Enabling RLS on {len(tables)} tables...")
    rls_enabled = 0
    
    for table in tables:
        try:
            # Check if table exists
            cur.execute(f"SELECT to_regclass('{table}')")
            if cur.fetchone()[0] is None:
                print(f"  ⚠️  Table '{table}' does not exist (skipping)")
                continue
            
            # Enable RLS
            cur.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
            # FORCE RLS so even table owner (sma_admin) is subject to policies
            cur.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
            print(f"  ✅ RLS enabled (FORCED) on: {table}")
            rls_enabled += 1
            
        except psycopg2.errors.DuplicateObject:
            print(f"  ℹ️  RLS already enabled on: {table}")
        except Exception as e:
            print(f"  ❌ Error on {table}: {e}")
    
    conn.commit()
    print(f"\n✅ RLS enabled on {rls_enabled} tables")
    
    # Now create policies
    print(f"\n📋 Creating RLS policies...")
    policies_created = 0
    
    for table in tables:
        try:
            # Skip if table doesn't exist
            cur.execute(f"SELECT to_regclass('{table}')")
            if cur.fetchone()[0] is None:
                continue
            
            policy_name = f"{table}_rls_policy"
            
            # Drop existing policy if it exists
            try:
                cur.execute(f"DROP POLICY IF EXISTS {policy_name} ON {table}")
            except:
                pass
            
            # Create new policy
            cur.execute(f"""
            CREATE POLICY {policy_name} ON {table}
            USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
            WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
            """)
            
            print(f"  ✅ Policy created: {policy_name}")
            policies_created += 1
            
        except Exception as e:
            print(f"  ⚠️  Policy error on {table}: {e}")
    
    conn.commit()
    print(f"\n✅ RLS policies created on {policies_created} tables")
    
    # Verify deployment
    print(f"\n🔍 Verifying RLS deployment...")
    cur.execute("SELECT COUNT(*) FROM pg_tables WHERE rowsecurity = true")
    rls_count = cur.fetchone()[0]
    print(f"\n✅ Total tables with RLS: {rls_count}")
    
    conn.close()
    
    print("\n" + "=" * 70)
    print("✅ RLS DEPLOYMENT COMPLETE!")
    print("=" * 70)
    print("\n📝 Next steps:")
    print("   1. Update routes with: db = get_db_with_rls(db, user_id)")
    print("   2. Run: python test_rls_isolation.py")
    print("   3. Verify all tests pass ✅")
    
except Exception as e:
    print(f"\n❌ DEPLOYMENT FAILED")
    print(f"   Error: {e}")
    import traceback
    traceback.print_exc()
