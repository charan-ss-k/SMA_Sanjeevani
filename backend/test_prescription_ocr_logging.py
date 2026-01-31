#!/usr/bin/env python
"""
Test script to verify OCR text extraction and logging improvements
"""

import requests
import json
import time
import sys
from pathlib import Path

# Configuration
API_URL = "http://localhost:8000"
PRESCRIPTION_PATH = Path(__file__).parent / "test images" / "FdZcM0WaMAASabt_1664381414282_1664381437487_1664381437487.webp"

print("=" * 80)
print("🧪 TESTING HANDWRITTEN PRESCRIPTION OCR - Enhanced Logging")
print("=" * 80)
print()

# Check if prescription image exists
if not PRESCRIPTION_PATH.exists():
    print(f"❌ Prescription image not found: {PRESCRIPTION_PATH}")
    print(f"📁 Please place a prescription image at: {PRESCRIPTION_PATH}")
    sys.exit(1)

print(f"✅ Found prescription image: {PRESCRIPTION_PATH.name}")
print(f"📊 File size: {PRESCRIPTION_PATH.stat().st_size:,} bytes")
print()

# Wait for server to be ready
print("⏳ Waiting for server to start...")
for i in range(10):
    try:
        response = requests.get(f"{API_URL}/health", timeout=2)
        if response.status_code == 200:
            print("✅ Server is ready!")
            break
    except:
        pass
    time.sleep(2)
else:
    print("❌ Server not responding. Please start the server with: python start.py")
    sys.exit(1)

print()
print("-" * 80)
print("📤 Uploading prescription for analysis...")
print("-" * 80)
print()

# Upload prescription
with open(PRESCRIPTION_PATH, 'rb') as f:
    files = {'file': (PRESCRIPTION_PATH.name, f, 'image/webp')}
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_URL}/api/prescriptions/analyze",
            files=files,
            timeout=120
        )
        elapsed = time.time() - start_time
        
        print(f"⏱️  Processing time: {elapsed:.2f} seconds")
        print(f"📊 HTTP Status: {response.status_code}")
        print()
        
        if response.status_code == 200:
            result = response.json()
            
            print("=" * 80)
            print("✅ ANALYSIS COMPLETE - CHECK SERVER LOGS FOR EXTRACTED TEXT")
            print("=" * 80)
            print()
            
            # Show summary
            print("📋 SUMMARY:")
            print("-" * 80)
            print(f"Status: {result.get('status', 'unknown')}")
            print(f"Stage: {result.get('stage', 'N/A')}")
            print()
            
            if 'ocr_results' in result:
                print("🔍 OCR METHODS USED:")
                for method, data in result['ocr_results'].items():
                    conf = data.get('confidence', 0) * 100
                    print(f"  - {method}: {conf:.1f}% confidence")
                print()
            
            if 'validation' in result:
                val = result['validation']
                print(f"✓ Text Valid: {val.get('valid', False)}")
                print(f"✓ Has Medical Keywords: {val.get('has_medical_keywords', False)}")
                print(f"✓ Confidence Level: {val.get('confidence_level', 'unknown')}")
                print()
            
            # Most important: medicines found
            medicines = result.get('medicines', [])
            print("💊 MEDICINES EXTRACTED:")
            print("-" * 80)
            if medicines:
                print(f"✅ Found {len(medicines)} medicine(s):")
                for i, med in enumerate(medicines, 1):
                    print(f"  {i}. {med}")
            else:
                print("❌ No medicines found")
                if 'extracted_text' in result:
                    print(f"\n📄 Extracted text available: {len(result['extracted_text'])} chars")
            print()
            
            # Check server logs message
            print("=" * 80)
            print("📋 IMPORTANT: Check server logs to see the FULL EXTRACTED TEXT")
            print("=" * 80)
            print()
            print("The server logs will show:")
            print("  1. ✅ Which OCR engines ran successfully")
            print("  2. 📄 Complete extracted text from the prescription")
            print("  3. 📊 Character count, word count, line count")
            print("  4. 🔄 When text is sent to LLM for parsing")
            print()
            
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(response.text)
            
    except requests.Timeout:
        print("❌ Request timeout - analysis taking too long")
    except Exception as e:
        print(f"❌ Error: {e}")

print()
print("=" * 80)
print("🏁 Test Complete")
print("=" * 80)
