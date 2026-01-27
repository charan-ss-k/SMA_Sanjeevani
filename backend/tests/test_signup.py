import json
import requests
import time

API_BASE = "http://127.0.0.1:8000"

# Test signup
signup_data = {
    "username": f"testuser_{int(time.time())}",
    "email": f"test_{int(time.time())}@sanjeevani.com",
    "password": "Test@1234",
    "first_name": "Test",
    "last_name": "User",
    "age": 30,
    "gender": "Male"
}

print("Testing signup with corrected fields:")
print(json.dumps(signup_data, indent=2))
print()

try:
    response = requests.post(f"{API_BASE}/api/auth/signup", json=signup_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
