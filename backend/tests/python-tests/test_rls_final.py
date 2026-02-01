"""
Final RLS isolation test with proper session handling
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.models import User, Prescription
from app.core.security import hash_password
from datetime import datetime

print("=" * 70)
print("🧪 RLS ISOLATION TEST - CORRECT SESSION HANDLING")
print("=" * 70)

db = SessionLocal()

try:
    # Clean up
    print("\n🧹 Cleaning test data...")
    db.query(Prescription).filter(Prescription.user_id.in_([10, 11])).delete(synchronize_session=False)
    db.commit()
    
    # Create test prescriptions
    print("\n📝 Creating test data...")
    p1 = Prescription(user_id=10, medicine_name="User10 Med1", dosage="100mg", frequency="1x", duration="5d", doctor_name="Dr. A", start_date=datetime.utcnow())
    p2 = Prescription(user_id=10, medicine_name="User10 Med2", dosage="200mg", frequency="2x", duration="7d", doctor_name="Dr. A", start_date=datetime.utcnow())
    p3 = Prescription(user_id=11, medicine_name="User11 Med1", dosage="300mg", frequency="3x", duration="10d", doctor_name="Dr. B", start_date=datetime.utcnow())
    p4 = Prescription(user_id=11, medicine_name="User11 Med2", dosage="400mg", frequency="4x", duration="14d", doctor_name="Dr. B", start_date=datetime.utcnow())
    
    db.add_all([p1, p2, p3, p4])
    db.commit()
    print(f"   ✅ Created 4 prescriptions (2 for user10, 2 for user11)")
    
    # Test RLS filtering
    print("\n🔍 Testing RLS filtering...")
    
    # User 10's session
    print("\n1️⃣ User 10 queries:")
    db.execute(text("SET app.current_user_id = '10'"))
    db.commit()  # Commit the SET statement
    
    # Now query
    result = db.execute(text("SELECT medicine_name, user_id FROM prescriptions WHERE user_id IN (10, 11)"))
    rows = result.fetchall()
    print(f"   Query returned {len(rows)} rows:")
    for med, uid in rows:
        print(f"      - {med} (user_id={uid})")
    
    if len(rows) == 2 and all(uid == 10 for _, uid in rows):
        print(f"   ✅ PASS: User 10 sees only their 2 prescriptions")
    else:
        print(f"   ❌ FAIL: User 10 sees {len(rows)} prescriptions (expected 2)")
    
    # User 11's session
    print("\n2️⃣ User 11 queries:")
    db.execute(text("SET app.current_user_id = '11'"))
    db.commit()  # Commit the SET statement
    
    result = db.execute(text("SELECT medicine_name, user_id FROM prescriptions WHERE user_id IN (10, 11)"))
    rows = result.fetchall()
    print(f"   Query returned {len(rows)} rows:")
    for med, uid in rows:
        print(f"      - {med} (user_id={uid})")
    
    if len(rows) == 2 and all(uid == 11 for _, uid in rows):
        print(f"   ✅ PASS: User 11 sees only their 2 prescriptions")
    else:
        print(f"   ❌ FAIL: User 11 sees {len(rows)} prescriptions (expected 2)")
    
    print("\n" + "=" * 70)
    print("✅ RLS TEST COMPLETE")
    print("=" * 70)
    
except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
