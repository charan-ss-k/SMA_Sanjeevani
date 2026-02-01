"""
Clean up orphan data (user_id = 0 or NULL) from all tables
This allows RLS to work properly by removing data that doesn't belong to any real user
"""
import psycopg2

db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("🧹 Cleaning up orphan data from database...")
print("=" * 70)

# Tables with user_id column
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

total_deleted = 0

for table in tables:
    try:
        # Count orphans
        cur.execute(f"SELECT COUNT(*) FROM {table} WHERE user_id = 0 OR user_id IS NULL")
        count = cur.fetchone()[0]
        
        if count > 0:
            # Delete orphans
            cur.execute(f"DELETE FROM {table} WHERE user_id = 0 OR user_id IS NULL")
            deleted = cur.rowcount
            print(f"  ✅ {table:30} - Deleted {deleted} orphan records")
            total_deleted += deleted
        else:
            print(f"  ✓  {table:30} - Clean (no orphans)")
            
    except Exception as e:
        print(f"  ⚠️  {table:30} - Error: {e}")

conn.commit()
conn.close()

print("=" * 70)
print(f"✅ Cleanup complete! Total records deleted: {total_deleted}")
print("\n📝 Next: Run test_rls_isolation.py to verify RLS isolation")
