"""
Test script for appointment booking endpoint
Run from backend directory: python ../test_appointment_booking.py
"""
import requests
import json
from datetime import datetime, timedelta

# Configuration
API_BASE = "http://localhost:8000"
TOKEN = None  # Will be set after login

def login_test_user():
    """Login to get authentication token"""
    global TOKEN
    
    print("\n🔐 Testing Login...")
    response = requests.post(
        f"{API_BASE}/api/auth/login",
        json={
            "username": "testuser",
            "password": "testpass123"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        TOKEN = data.get("access_token")
        print(f"✅ Login successful. Token: {TOKEN[:20]}...")
        return True
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def test_search_options():
    """Test getting search options"""
    print("\n📋 Testing Search Options...")
    response = requests.get(f"{API_BASE}/api/appointments/search/options")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Search options retrieved:")
        print(f"  - States: {len(data.get('states', []))} found")
        print(f"  - Cities: {len(data.get('cities', []))} found")
        print(f"  - Specializations: {len(data.get('specializations', []))} found")
        return data
    else:
        print(f"❌ Failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_search_doctors(options):
    """Test doctor search"""
    print("\n🔍 Testing Doctor Search...")
    
    if not options:
        print("⚠️ Skipping search - no options available")
        return None
    
    # Use first available options
    search_data = {
        "state": options['states'][0] if options['states'] else None,
        "city": options['cities'][0] if options['cities'] else None,
        "specialization": options['specializations'][0] if options['specializations'] else None,
    }
    
    response = requests.post(
        f"{API_BASE}/api/appointments/search",
        json=search_data
    )
    
    if response.status_code == 200:
        data = response.json()
        doctors = data.get('doctors', [])
        print(f"✅ Search successful. Found {len(doctors)} doctors")
        if doctors:
            print(f"  - First doctor: {doctors[0]['name']} (ID: {doctors[0]['employee_id']})")
            return doctors[0]
    else:
        print(f"❌ Search failed: {response.status_code}")
        print(f"Response: {response.text}")
    return None

def test_book_appointment(doctor):
    """Test appointment booking"""
    print("\n📅 Testing Appointment Booking...")
    
    if not doctor:
        print("⚠️ Skipping booking - no doctor available")
        return None
    
    if not TOKEN:
        print("⚠️ Skipping booking - not authenticated")
        return None
    
    # Create appointment data
    tomorrow = datetime.now() + timedelta(days=1)
    appointment_data = {
        "doctor_id": doctor['employee_id'],
        "patient_name": "Test Patient",
        "patient_email": "test@example.com",
        "patient_phone": "9876543210",
        "appointment_date": tomorrow.strftime("%Y-%m-%d"),
        "appointment_time": "14:30",
        "notes": "Test appointment"
    }
    
    print(f"  📤 Sending: {json.dumps(appointment_data, indent=2)}")
    
    response = requests.post(
        f"{API_BASE}/api/appointments/book",
        json=appointment_data,
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    
    print(f"  Status Code: {response.status_code}")
    print(f"  Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Booking successful!")
        print(f"  - Appointment ID: {data.get('appointment_id')}")
        return data
    else:
        print(f"❌ Booking failed: {response.status_code}")
        return None

def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 Appointment System Test Suite")
    print("=" * 60)
    
    # Test 1: Login
    if not login_test_user():
        print("\n⚠️ Cannot proceed without login")
        return
    
    # Test 2: Get search options
    options = test_search_options()
    
    # Test 3: Search doctors
    doctor = test_search_doctors(options)
    
    # Test 4: Book appointment
    test_book_appointment(doctor)
    
    print("\n" + "=" * 60)
    print("✅ Test suite complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
