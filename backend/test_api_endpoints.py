#!/usr/bin/env python
"""
Test script to verify all API endpoints and database connectivity
"""
import requests
import json
import time

API_BASE = "http://127.0.0.1:8000"

def test_health():
    """Test the health endpoint"""
    print("\n" + "="*60)
    print("Testing Health Endpoint")
    print("="*60)
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"✓ Status Code: {response.status_code}")
        print(f"✓ Response: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_register_user():
    """Test user registration"""
    print("\n" + "="*60)
    print("Testing User Registration")
    print("="*60)
    user_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@sanjeevani.com",
        "password": "Test@1234"
    }
    try:
        response = requests.post(f"{API_BASE}/api/auth/register", json=user_data)
        print(f"✓ Status Code: {response.status_code}")
        result = response.json()
        print(f"✓ Response: {json.dumps(result, indent=2)}")
        if response.status_code == 200:
            return True, user_data["email"], user_data["password"]
        else:
            return False, None, None
    except Exception as e:
        print(f"✗ Error: {e}")
        return False, None, None

def test_login(email, password):
    """Test user login"""
    print("\n" + "="*60)
    print("Testing User Login")
    print("="*60)
    login_data = {
        "username": email,
        "password": password
    }
    try:
        response = requests.post(f"{API_BASE}/api/auth/login", data=login_data)
        print(f"✓ Status Code: {response.status_code}")
        result = response.json()
        print(f"✓ Response: {json.dumps(result, indent=2)}")
        if response.status_code == 200 and "access_token" in result:
            return True, result["access_token"]
        else:
            return False, None
    except Exception as e:
        print(f"✗ Error: {e}")
        return False, None

def test_create_prescription(token):
    """Test creating a prescription"""
    print("\n" + "="*60)
    print("Testing Create Prescription")
    print("="*60)
    prescription_data = {
        "medicine_name": "Aspirin",
        "dosage": "500mg",
        "frequency": "twice daily",
        "duration": "7 days",
        "doctor_name": "Dr. Smith",
        "notes": "Take with food"
    }
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(
            f"{API_BASE}/api/prescriptions",
            json=prescription_data,
            headers=headers
        )
        print(f"✓ Status Code: {response.status_code}")
        result = response.json()
        print(f"✓ Response: {json.dumps(result, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_get_prescriptions(token):
    """Test getting prescriptions"""
    print("\n" + "="*60)
    print("Testing Get Prescriptions")
    print("="*60)
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(
            f"{API_BASE}/api/prescriptions",
            headers=headers
        )
        print(f"✓ Status Code: {response.status_code}")
        result = response.json()
        print(f"✓ Response: {json.dumps(result, indent=2)[:500]}")
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("SMA Sanjeevani API Endpoint Tests")
    print("="*60)
    
    # Test health
    if not test_health():
        print("\n✗ Cannot connect to API. Is the backend running?")
        return
    
    # Test registration
    success, email, password = test_register_user()
    if not success:
        print("\n✗ User registration failed")
        return
    
    # Test login
    success, token = test_login(email, password)
    if not success:
        print("\n✗ User login failed")
        return
    
    # Test prescription creation
    if not test_create_prescription(token):
        print("\n✗ Prescription creation failed")
    else:
        print("\n✓ Prescription created successfully")
    
    # Test getting prescriptions
    if not test_get_prescriptions(token):
        print("\n✗ Getting prescriptions failed")
    else:
        print("\n✓ Prescriptions retrieved successfully")
    
    print("\n" + "="*60)
    print("✓ All tests completed!")
    print("="*60)

if __name__ == "__main__":
    main()
