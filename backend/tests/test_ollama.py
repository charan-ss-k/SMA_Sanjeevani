#!/usr/bin/env python3
"""
Test script to verify Ollama and Neural-Chat-7B are working correctly
"""
import requests
import json
import sys

OLLAMA_URL = "http://localhost:11434"
MODEL = "neural-chat"

def test_ollama_connection():
    print("\n1. Testing Ollama connection...")
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            print("✓ Ollama is running at", OLLAMA_URL)
            models = resp.json().get("models", [])
            print(f"✓ Available models: {[m['name'] for m in models]}")
            return True
        else:
            print("✗ Ollama returned status:", resp.status_code)
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to Ollama at", OLLAMA_URL)
        print("  Start Ollama with: ollama serve")
        return False

def test_mistral_model():
    print("\n2. Testing Neural-Chat model...")
    resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
    models = resp.json().get("models", [])
    model_names = [m['name'] for m in models]
    
    if any("neural-chat" in m.lower() for m in model_names):
        print("✓ Neural-Chat model is available")
        return True
    else:
        print("✗ Neural-Chat model not found")
        print("  Install with: ollama pull neural-chat")
        return False

def test_mistral_generation():
    print("\n3. Testing Neural-Chat generation...")
    payload = {
        "model": MODEL,
        "prompt": "Respond with only valid JSON. If patient has fever and headache, what condition? Return: {\"predicted_condition\": \"...\"}",
        "stream": False,
        "temperature": 0.3,
    }
    try:
        resp = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=60)
        if resp.status_code == 200:
            output = resp.json().get("response", "")
            print("✓ Mistral responded successfully")
            print(f"  Response (first 200 chars): {output[:200]}")
            
            # Try to parse JSON
            try:
                json.loads(output)
                print("✓ Output is valid JSON")
                return True
            except:
                print("✗ Output is not valid JSON")
                return False
        else:
            print("✗ Mistral returned status:", resp.status_code)
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    print("="*60)
    print("SMA Sanjeevani - Ollama/Neural-Chat Setup Verification")
    print("="*60)
    
    checks = [
        test_ollama_connection(),
        test_mistral_model(),
        test_mistral_generation(),
    ]
    
    print("\n" + "="*60)
    if all(checks):
        print("✓ All checks passed! Ollama and Neural-Chat are ready.")
        print("\nNow:")
        print("1. Make sure .env has: LLM_PROVIDER=ollama")
        print("2. Start backend: python -m uvicorn backend.main:app --port 8000")
        print("3. Test endpoint: curl http://127.0.0.1:8000/api/symptoms/status")
    else:
        print("✗ Some checks failed. See errors above.")
        sys.exit(1)
    print("="*60)

if __name__ == "__main__":
    main()
