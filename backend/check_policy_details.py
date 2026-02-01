import psycopg2

conn = psycopg2.connect('postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require')
cur = conn.cursor()

cur.execute("""
    SELECT 
        polname,
        polcmd,
        polpermissive,
        polroles::regrole[]
    FROM pg_policy 
    WHERE polrelid = 'prescriptions'::regclass
""")

print("📋 RLS Policy Details for 'prescriptions' table:")
print("=" * 70)
for name, cmd, permissive, roles in cur.fetchall():
    print(f"\nPolicy: {name}")
    print(f"  Command: {cmd} (* = ALL, r = SELECT, a = INSERT, w = UPDATE, d = DELETE)")
    print(f"  Permissive: {permissive} (True = permissive, False = restrictive)")
    print(f"  Roles: {roles}")

print("\n" + "=" * 70)
print(f"\n💡 If cmd='*', policy applies to ALL commands")
print(f"💡 If roles contains 'PUBLIC', policy applies to all users")

conn.close()
