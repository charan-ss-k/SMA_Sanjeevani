import psycopg2

conn = psycopg2.connect('postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require')
cur = conn.cursor()

# Check policy command
cur.execute("SELECT cmd FROM pg_policies WHERE tablename = 'prescriptions'")
cmd = cur.fetchone()[0]
print(f"Policy applies to: {cmd}")

# The issue: policies with cmd='*' apply to ALL operations
# But we need to verify the policy exists and is active

cur.execute("""
    SELECT COUNT(*) FROM pg_policies 
    WHERE tablename = 'prescriptions' 
    AND cmd = '*'
""")
count = cur.fetchone()[0]
print(f"Number of ALL-command policies: {count}")

conn.close()
