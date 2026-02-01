import psycopg2

db_url = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Check current user
cur.execute("SELECT current_user, session_user")
user, session = cur.fetchone()
print(f"🔑 Current database user: {user}")
print(f"🔑 Session user: {session}")

# Check if user is superuser or table owner
cur.execute("""
    SELECT usename, usesuper 
    FROM pg_user 
    WHERE usename = current_user
""")
name, is_super = cur.fetchone()
print(f"\n📋 User: {name}")
print(f"📋 Is superuser: {is_super}")

# Check table owner
cur.execute("""
    SELECT tableowner 
    FROM pg_tables 
    WHERE tablename = 'prescriptions'
""")
owner = cur.fetchone()[0]
print(f"📋 Prescriptions table owner: {owner}")

if user == owner or is_super:
    print(f"\n⚠️  WARNING: {user} is the table owner or superuser!")
    print(f"   RLS policies are BYPASSED for table owners and superusers by default.")
    print(f"   PostgreSQL documentation: \"Row security policies are bypassed by table owners and superusers.\"")
    print(f"\n🔧 FIX: Need to use FORCE ROW LEVEL SECURITY on tables:")
    print(f"   ALTER TABLE prescriptions FORCE ROW LEVEL SECURITY;")
else:
    print(f"\n✅ User is NOT table owner - RLS should work")

# Check if FORCE RLS is enabled
cur.execute("""
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE tablename = 'prescriptions'
""")
table, rls_enabled = cur.fetchone()
print(f"\n📊 RLS status on {table}: {rls_enabled}")

conn.close()
