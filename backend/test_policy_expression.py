import psycopg2

conn = psycopg2.connect('postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require')
cur = conn.cursor()

print("🧪 Testing RLS Policy Expression...")
print("=" * 70)

# Test 1: Set session variable
print("\n1️⃣ Setting session variable to '10'...")
cur.execute("SET app.current_user_id = '10'")
print("   ✅ Set")

# Test 2: Read it back
cur.execute("SELECT current_setting('app.current_user_id', true)")
value = cur.fetchone()[0]
print(f"   Value: '{value}' (type: {type(value).__name__})")

# Test 3: Cast to INTEGER
cur.execute("SELECT CAST(current_setting('app.current_user_id', true) AS INTEGER)")
int_value = cur.fetchone()[0]
print(f"   Cast to INTEGER: {int_value} (type: {type(int_value).__name__})")

# Test 4: Test the exact policy expression
cur.execute("""
    SELECT user_id, 
           user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER) as matches_policy
    FROM prescriptions
""")
print("\n2️⃣ Testing policy expression on all prescriptions:")
for user_id, matches in cur.fetchall():
    status = "✅ MATCH" if matches else "❌ NO MATCH"
    print(f"   user_id={user_id} → {status}")

# Test 5: Query with RLS (should only return user_id=10)
print("\n3️⃣ Querying with RLS active:")
cur.execute("SELECT COUNT(*) FROM prescriptions")
count = cur.fetchone()[0]
print(f"   Total prescriptions visible: {count}")

cur.execute("SELECT user_id, COUNT(*) FROM prescriptions GROUP BY user_id")
print("   Breakdown by user_id:")
for uid, cnt in cur.fetchall():
    print(f"     user_id={uid}: {cnt} prescriptions")

conn.close()

print("\n" + "=" * 70)
print("🔍 If you see prescriptions from multiple user_ids, RLS is NOT working!")
