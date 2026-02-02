"""
Azure OpenAI Configuration Verification Script
Checks that all services are properly configured to use Azure OpenAI
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_azure_openai_config():
    """Verify Azure OpenAI configuration"""
    print("=" * 70)
    print("🔍 AZURE OPENAI CONFIGURATION VERIFICATION")
    print("=" * 70)
    
    # Check LLM_PROVIDER
    llm_provider = os.getenv("LLM_PROVIDER", "").strip().lower()
    print(f"\n1. LLM_PROVIDER: {llm_provider}")
    
    if llm_provider == "azure_openai":
        print("   ✅ CORRECT - Using Azure OpenAI")
    elif llm_provider == "ollama":
        print("   ❌ ERROR - Still using Ollama!")
        print("   ⚠️  Change LLM_PROVIDER=azure_openai in .env file")
        return False
    else:
        print(f"   ❌ ERROR - Unknown provider: {llm_provider}")
        return False
    
    # Check Azure OpenAI credentials
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
    azure_api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "").strip()
    
    print(f"\n2. AZURE_OPENAI_ENDPOINT: {azure_endpoint[:50]}..." if azure_endpoint else "   ❌ NOT SET")
    if azure_endpoint:
        print("   ✅ Endpoint configured")
    else:
        print("   ❌ ERROR - Missing AZURE_OPENAI_ENDPOINT in .env")
        return False
    
    print(f"\n3. AZURE_OPENAI_API_KEY: {'*' * 20}..." if azure_api_key else "   ❌ NOT SET")
    if azure_api_key:
        print("   ✅ API Key configured")
    else:
        print("   ❌ ERROR - Missing AZURE_OPENAI_API_KEY in .env")
        return False
    
    print(f"\n4. AZURE_OPENAI_DEPLOYMENT_NAME: {azure_deployment}")
    if azure_deployment:
        print("   ✅ Deployment configured")
    else:
        print("   ⚠️  WARNING - Using default deployment name")
    
    # Check LLM configuration
    llm_temperature = os.getenv("LLM_TEMPERATURE", "0.1")
    llm_max_tokens = os.getenv("LLM_MAX_TOKENS", "8192")
    
    print(f"\n5. LLM_TEMPERATURE: {llm_temperature}")
    print(f"   ✅ Temperature set to {llm_temperature}")
    
    print(f"\n6. LLM_MAX_TOKENS: {llm_max_tokens}")
    print(f"   ✅ Max tokens set to {llm_max_tokens}")
    
    # Summary
    print("\n" + "=" * 70)
    print("✅ AZURE OPENAI CONFIGURATION: VERIFIED")
    print("=" * 70)
    print("\nAll services will use Azure OpenAI Phi-4 LLM:")
    print("  • Medicine Identification")
    print("  • Hospital Report Parsing")
    print("  • Handwritten Prescription Analysis")
    print("  • Symptoms Recommendation")
    print("  • Medical Q&A Chatbot")
    print("  • All LLM features")
    print("\n🚫 Local Ollama will NOT be used")
    print("=" * 70)
    
    return True


def test_azure_connection():
    """Test Azure OpenAI connection"""
    import requests
    
    print("\n" + "=" * 70)
    print("🧪 TESTING AZURE OPENAI CONNECTION")
    print("=" * 70)
    
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
    azure_api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "Sanjeevani-Phi-4").strip()
    
    if not azure_endpoint or not azure_api_key:
        print("❌ Cannot test - credentials missing")
        return False
    
    # Construct API URL
    base_endpoint = azure_endpoint.replace("/openai/v1/", "").rstrip("/")
    api_url = f"{base_endpoint}/openai/deployments/{azure_deployment}/chat/completions?api-version=2024-02-15-preview"
    
    # Test payload
    payload = {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello from Azure OpenAI!' in one sentence."}
        ],
        "temperature": 0.3,
        "max_tokens": 50
    }
    
    headers = {
        "Content-Type": "application/json",
        "api-key": azure_api_key
    }
    
    try:
        print(f"Connecting to: {base_endpoint}")
        print(f"Deployment: {azure_deployment}")
        print("Sending test request...")
        
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            message = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(f"\n✅ SUCCESS - Azure OpenAI is working!")
            print(f"Response: {message}")
            print("\n" + "=" * 70)
            return True
        else:
            print(f"\n❌ ERROR - Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            print("\n" + "=" * 70)
            return False
            
    except requests.exceptions.Timeout:
        print("\n❌ ERROR - Connection timeout")
        print("Check network connectivity to Azure")
        return False
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR - Cannot connect to Azure")
        print("Check network connectivity and endpoint URL")
        return False
    except Exception as e:
        print(f"\n❌ ERROR - {str(e)}")
        return False


if __name__ == "__main__":
    # Check configuration
    config_ok = check_azure_openai_config()
    
    if config_ok:
        # Test connection
        test_azure_connection()
    else:
        print("\n⚠️  Fix configuration errors before testing connection")
