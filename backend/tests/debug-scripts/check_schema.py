import psycopg2

# Hardcode Azure PostgreSQL credentials (override any defaults)
db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

print(f"🔗 Connecting to Azure PostgreSQL...")
print(f"   {db_url[:70]}...")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Check reminders table structure
    cur.execute('''SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'reminders' ORDER BY ordinal_position''')
    cols = [row[0] for row in cur.fetchall()]
    print(f"\n✅ Connected to database!")
    print(f"\nREMINDERS table columns ({len(cols)} total):")
    for col in cols:
        print(f"  - {col}")
    
    # Check for next_reminder_at
    if 'next_reminder_at' in cols:
        print("\n✅ next_reminder_at column EXISTS")
    else:
        print("\n❌ next_reminder_at column MISSING - need to add it")
    
    # Check if RLS is enabled on any table
    cur.execute('''SELECT COUNT(*) FROM pg_tables WHERE rowsecurity = true''')
    rls_count = cur.fetchone()[0]
    print(f"\n📊 Tables with RLS enabled: {rls_count}")
    
    if rls_count == 0:
        print("   ⚠️  RLS not yet enabled - will need to deploy it")
    else:
        # Show which tables have RLS
        cur.execute('''SELECT tablename FROM pg_tables WHERE rowsecurity = true LIMIT 5''')
        tables = [row[0] for row in cur.fetchall()]
        print(f"   ✅ Tables: {', '.join(tables)}")
    
    conn.close()
    print("\n✅ Schema check complete!")
    
except Exception as e:
    print(f"\n❌ Error: {type(e).__name__}")
    print(f"   {e}")
