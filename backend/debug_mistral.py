#!/usr/bin/env python3
"""
Debug script to check Neural-Chat-7B output directly
Shows exactly what Neural-Chat returns
"""
import requests
import json
import sys

OLLAMA_URL = "http://localhost:11434"
MODEL = "neural-chat"

print("\n" + "="*70)
print("SMA Sanjeevani - Neural-Chat-7B Direct Output Test")
print("="*70)

# Test 1: Check connection
print("\n[1/3] Checking Ollama connection...")
try:
    resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
    if resp.status_code == 200:
        print("✓ Ollama is running")
        models = resp.json().get("models", [])
        print(f"✓ Models available: {[m['name'] for m in models]}")
    else:
        print("✗ Ollama error:", resp.status_code)
        sys.exit(1)
except Exception as e:
    print("✗ Cannot connect to Ollama at", OLLAMA_URL)
    print("  Error:", e)
    print("  Start Ollama with: ollama serve")
    sys.exit(1)

# Test 2: Simple health check
print("\n[2/3] Simple health check...")
simple_prompt = "Respond with JSON only. For headache, what medicine? {\"medicine\": \"...\"}"
payload = {
    "model": MODEL,
    "prompt": simple_prompt,
    "stream": False,
    "temperature": 0.2,
}

try:
    print(f"Sending to Ollama (this may take 30-120 seconds)...")
    resp = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=300)
    
    if resp.status_code == 200:
        output = resp.json().get("response", "")
        print("✓ Neural-Chat responded!")
        print("\n--- NEURAL-CHAT EXACT OUTPUT ---")
        print(output)
        print("--- END OUTPUT ---\n")
    else:
        print("✗ Error:", resp.status_code)
        print(resp.text)
except requests.exceptions.Timeout:
    print("✗ TIMEOUT: Neural-Chat took too long (>300 seconds)")
    print("  This is normal for slow systems")
    print("  Try: ollama pull neural-chat (faster model)")
except Exception as e:
    print("✗ Error:", e)

# Test 3: Full medical prompt
print("\n[3/3] Testing full medical prompt...")
medical_prompt = """You are a medical assistant. For a 28-year-old male with headache, provide:
1. Condition name
2. Best OTC medicine
3. Home care advice
Return ONLY valid JSON with keys: condition, medicine, dosage, advice"""

payload["prompt"] = medical_prompt

try:
    print(f"Sending medical prompt to Ollama...")
    resp = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=300)
    
    if resp.status_code == 200:
        output = resp.json().get("response", "")
        print("✓ Neural-Chat responded!")
        print("\n--- NEURAL-CHAT MEDICAL OUTPUT ---")
        print(output)
        print("--- END OUTPUT ---\n")
        
        # Try to parse as JSON
        try:
            json_output = json.loads(output)
            print("✓ Output is valid JSON!")
            print("Parsed:", json.dumps(json_output, indent=2))
        except:
            print("⚠ Output is not valid JSON (but Mistral is responding)")
    else:
        print("✗ Error:", resp.status_code)
        print(resp.text)
except requests.exceptions.Timeout:
    print("✗ TIMEOUT after 300 seconds")
except Exception as e:
    print("✗ Error:", e)

print("\n" + "="*70)
print("If all above worked, Neural-Chat is ready!")
print("="*70)
