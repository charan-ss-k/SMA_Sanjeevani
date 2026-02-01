import psycopg2

db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Check RLS policy details
cur.execute("""
    SELECT schemaname, tablename, policyname, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'prescriptions'
""")

print("📋 RLS Policy on prescriptions table:")
for schema, table, policy, qual, with_check in cur.fetchall():
    print(f"\n  Table: {table}")
    print(f"  Policy: {policy}")
    print(f"  USING: {qual}")
    print(f"  WITH CHECK: {with_check}")

# Check prescriptions with user_id = 0
cur.execute("SELECT COUNT(*) FROM prescriptions WHERE user_id = 0 OR user_id IS NULL")
orphan_count = cur.fetchone()[0]
print(f"\n⚠️  Orphan prescriptions (user_id=0 or NULL): {orphan_count}")

if orphan_count > 0:
    print("\n🔧 Fix: Need to either:")
    print("   1. Delete orphan data: DELETE FROM prescriptions WHERE user_id = 0 OR user_id IS NULL")
    print("   2. Or assign to a default user")

conn.close()
