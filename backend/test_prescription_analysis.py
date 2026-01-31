#!/usr/bin/env python
"""Test script to verify handwritten prescription analysis"""

import requests
import json
import time
import os

# Give server time to start
time.sleep(3)

API_URL = "http://localhost:8000"

print("=" * 70)
print("🧪 Testing Handwritten Prescription Analysis API")
print("=" * 70)

# Find a prescription image
test_images = [f for f in os.listdir(".") if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]

if not test_images:
    print("❌ No prescription images found in current directory")
    print("📁 Looking in Documents/GitHub directory...")
    parent_dir = "c:\\Users\\kchar_\\Documents\\GitHub\\SMA_Sanjeevani"
    if os.path.exists(parent_dir):
        test_images = [f for f in os.listdir(parent_dir) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]

if test_images:
    test_image = test_images[0]
    print(f"\n✅ Found test image: {test_image}")
    
    # Prepare the file
    with open(test_image, 'rb') as f:
        files = {'file': (test_image, f, 'image/webp' if test_image.endswith('.webp') else 'image/jpeg')}
        
        # Test the analyze endpoint
        print(f"\n📤 Uploading prescription to: {API_URL}/api/prescriptions/analyze")
        
        response = requests.post(
            f"{API_URL}/api/prescriptions/analyze",
            files=files,
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Analysis Complete!")
            print(json.dumps(result, indent=2))
            
            # Extract key metrics
            if 'ocr_results' in result:
                print("\n📋 OCR Summary:")
                for method, data in result['ocr_results'].items():
                    print(f"  - {method}: {data.get('confidence', 0):.2%} confidence")
            
            if 'medicines' in result:
                print(f"\n💊 Medicines Found: {len(result['medicines'])}")
                for med in result['medicines']:
                    print(f"  - {med}")
        else:
            print(f"❌ Error: {response.text}")
else:
    print("\n❌ No prescription images available for testing")
    print("\n📝 To test, please provide a prescription image in the current directory")

print("\n" + "=" * 70)
