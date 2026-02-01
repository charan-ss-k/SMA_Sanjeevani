import psycopg2

conn = psycopg2.connect('postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require')
cur = conn.cursor()

# Get policy details
cur.execute("SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'prescriptions'::regclass")
policies = cur.fetchall()
print(f"📋 RLS Policies on prescriptions: {len(policies)}")
for name, cmd in policies:
    print(f"  - {name} (command: {cmd})")

# Check if FORCE RLS is enabled
cur.execute("SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'prescriptions'")
name, rls, force_rls = cur.fetchone()
print(f"\n📊 Table: {name}")
print(f"   RLS enabled: {rls}")
print(f"   FORCE RLS: {force_rls}")

if not force_rls:
    print(f"\n⚠️  FORCE RLS is FALSE - owner (sma_admin) bypasses RLS!")
    print(f"   This is why RLS doesn't work.")

conn.close()
