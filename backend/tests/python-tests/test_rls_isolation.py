"""
TEST RLS ISOLATION - Verify 2 users have completely isolated data
"""

import os
import sys

# Force Azure PostgreSQL connection (override any .env)
os.environ['DATABASE_URL'] = "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.rls_context import RLSContextManager
from app.models.models import User, Prescription, Reminder
from app.core.security import hash_password
from datetime import datetime, timedelta

def test_rls_isolation():
    """Test that RLS properly isolates data between 2 users"""
    
    print("=" * 70)
    print("🧪 TESTING RLS ISOLATION - 2 USERS")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # STEP 1: Create 2 test users
        print("\n1️⃣ Creating 2 test users...")
        
        # Clean up existing test data (delete prescriptions first, then users)
        db.query(Prescription).filter(Prescription.user_id.in_(
            db.query(User.id).filter(User.username.in_(['testuser1', 'testuser2']))
        )).delete(synchronize_session=False)
        db.query(Reminder).filter(Reminder.user_id.in_(
            db.query(User.id).filter(User.username.in_(['testuser1', 'testuser2']))
        )).delete(synchronize_session=False)
        db.query(User).filter(User.username.in_(['testuser1', 'testuser2'])).delete(synchronize_session=False)
        db.commit()
        print("   ✅ Cleaned up existing test data")
        
        user1 = User(
            username='testuser1',
            email='testuser1@sanjeevani.test',
            password_hash=hash_password('password123'),
            first_name='Test',
            last_name='User1',
            age=30,
            gender='Male'
        )
        
        user2 = User(
            username='testuser2',
            email='testuser2@sanjeevani.test',
            password_hash=hash_password('password123'),
            first_name='Test',
            last_name='User2',
            age=28,
            gender='Female'
        )
        
        db.add(user1)
        db.add(user2)
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        
        user1_id = user1.id
        user2_id = user2.id
        
        print(f"   ✅ User1 created (ID: {user1_id})")
        print(f"   ✅ User2 created (ID: {user2_id})")
        
        # STEP 2: User1 creates prescriptions
        print(f"\n2️⃣ User1 creates prescriptions...")
        
        # Set RLS context for User1
        RLSContextManager.set_user_context(db, user1_id)
        
        rx1 = Prescription(
            user_id=user1_id,
            medicine_name='Aspirin',
            dosage='500mg',
            frequency='2x daily',
            duration='7 days',
            doctor_name='Dr. Smith',
            start_date=datetime.utcnow()
        )
        
        rx2 = Prescription(
            user_id=user1_id,
            medicine_name='Ibuprofen',
            dosage='200mg',
            frequency='3x daily',
            duration='5 days',
            doctor_name='Dr. Smith',
            start_date=datetime.utcnow()
        )
        
        db.add(rx1)
        db.add(rx2)
        db.commit()
        db.refresh(rx1)
        db.refresh(rx2)
        
        print(f"   ✅ User1 created 2 prescriptions")
        print(f"      - Aspirin (ID: {rx1.id})")
        print(f"      - Ibuprofen (ID: {rx2.id})")
        
        # STEP 3: User2 creates prescriptions
        print(f"\n3️⃣ User2 creates prescriptions...")
        
        # Set RLS context for User2
        RLSContextManager.set_user_context(db, user2_id)
        
        rx3 = Prescription(
            user_id=user2_id,
            medicine_name='Paracetamol',
            dosage='1000mg',
            frequency='1x daily',
            duration='3 days',
            doctor_name='Dr. Johnson',
            start_date=datetime.utcnow()
        )
        
        rx4 = Prescription(
            user_id=user2_id,
            medicine_name='Antibiotics',
            dosage='500mg',
            frequency='4x daily',
            duration='10 days',
            doctor_name='Dr. Johnson',
            start_date=datetime.utcnow()
        )
        
        db.add(rx3)
        db.add(rx4)
        db.commit()
        db.refresh(rx3)
        db.refresh(rx4)
        
        print(f"   ✅ User2 created 2 prescriptions")
        print(f"      - Paracetamol (ID: {rx3.id})")
        print(f"      - Antibiotics (ID: {rx4.id})")
        
        # STEP 4: Test RLS - User1 should see ONLY their prescriptions
        print(f"\n4️⃣ TEST: User1 queries prescriptions...")
        
        RLSContextManager.set_user_context(db, user1_id)
        user1_prescriptions = db.query(Prescription).all()
        
        print(f"   User1 sees {len(user1_prescriptions)} prescriptions:")
        for rx in user1_prescriptions:
            print(f"      - {rx.medicine_name} (ID: {rx.id}, user_id: {rx.user_id})")
        
        # Verify User1 sees only their data
        user1_sees_own = all(rx.user_id == user1_id for rx in user1_prescriptions)
        user1_count_correct = len(user1_prescriptions) == 2
        
        if user1_sees_own and user1_count_correct:
            print(f"   ✅ PASS: User1 sees ONLY their 2 prescriptions")
        else:
            print(f"   ❌ FAIL: User1 sees wrong data!")
            return False
        
        # STEP 5: Test RLS - User2 should see ONLY their prescriptions
        print(f"\n5️⃣ TEST: User2 queries prescriptions...")
        
        RLSContextManager.set_user_context(db, user2_id)
        user2_prescriptions = db.query(Prescription).all()
        
        print(f"   User2 sees {len(user2_prescriptions)} prescriptions:")
        for rx in user2_prescriptions:
            print(f"      - {rx.medicine_name} (ID: {rx.id}, user_id: {rx.user_id})")
        
        # Verify User2 sees only their data
        user2_sees_own = all(rx.user_id == user2_id for rx in user2_prescriptions)
        user2_count_correct = len(user2_prescriptions) == 2
        
        if user2_sees_own and user2_count_correct:
            print(f"   ✅ PASS: User2 sees ONLY their 2 prescriptions")
        else:
            print(f"   ❌ FAIL: User2 sees wrong data!")
            return False
        
        # STEP 6: Verify cross-contamination doesn't happen
        print(f"\n6️⃣ TEST: Cross-user isolation check...")
        
        user1_med_names = {rx.medicine_name for rx in user1_prescriptions}
        user2_med_names = {rx.medicine_name for rx in user2_prescriptions}
        overlap = user1_med_names & user2_med_names
        
        if overlap:
            print(f"   ❌ FAIL: Found overlapping medicines: {overlap}")
            return False
        else:
            print(f"   ✅ PASS: No data overlap between users")
            print(f"      User1 medicines: {user1_med_names}")
            print(f"      User2 medicines: {user2_med_names}")
        
        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED - RLS ISOLATION WORKING!")
        print("=" * 70)
        print("\n📊 Summary:")
        print(f"   - User1 (ID: {user1_id}): 2 prescriptions, isolated ✅")
        print(f"   - User2 (ID: {user2_id}): 2 prescriptions, isolated ✅")
        print(f"   - No cross-contamination ✅")
        print(f"   - RLS Context Manager working ✅")
        print("\n✨ RLS is properly isolating per-user data!\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()


if __name__ == "__main__":
    success = test_rls_isolation()
    sys.exit(0 if success else 1)
