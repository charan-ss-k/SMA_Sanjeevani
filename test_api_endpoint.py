#!/usr/bin/env python
import requests
import time

# Wait for servers to be ready
print("Waiting 2 seconds for servers to initialize...")
time.sleep(2)

try:
    print("\n🔍 Testing /api/appointments/search/options endpoint...")
    response = requests.get('http://localhost:8000/api/appointments/search/options', timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ SUCCESS! Got response:")
        print(f"  - Success: {data.get('success')}")
        if 'options' in data:
            options = data['options']
            print(f"  - States: {len(options.get('states', []))} → {options.get('states', [])[:3]}")
            print(f"  - Cities: {len(options.get('cities', []))} → {options.get('cities', [])[:3]}")
            print(f"  - Localities: {len(options.get('localities', []))} → {options.get('localities', [])[:3]}")
            print(f"  - Specializations: {len(options.get('specializations', []))} → {options.get('specializations', [])[:3]}")
            print(f"  - Native Languages: {len(options.get('native_languages', []))} → {options.get('native_languages', [])[:3]}")
            print(f"  - Languages: {len(options.get('languages', []))} → {options.get('languages', [])[:3]}")
    else:
        print(f"❌ ERROR: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Connection error: {e}")
