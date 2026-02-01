import psycopg2

db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Get all user_id-related tables
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
""")

print("📊 All tables in sanjeevani_finaldb:")
tables = []
for (table,) in cur.fetchall():
    tables.append(table)
    print(f"  - {table}")

# Check which ones have user_id column
print(f"\n📋 Tables with 'user_id' column:")
for table in tables:
    cur.execute(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table}' AND column_name = 'user_id'
    """)
    if cur.fetchone():
        print(f"  ✅ {table}")

conn.close()
