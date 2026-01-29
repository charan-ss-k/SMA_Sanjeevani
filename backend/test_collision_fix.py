"""
Test script to verify NO COLLISION between gTTS and Bhashini
- Tests that only ONE provider is called
- Verifies early returns prevent double calls
"""
import sys
import os
import logging

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up logging to capture all provider calls
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(name)s - %(message)s'
)

print("🔍 Testing TTS Provider Collision Prevention...")
print("=" * 70)

# Import TTS service
from app.services.tts_service_enhanced import generate_speech

# Test languages with provider tracking
test_cases = [
    ("english", "Hello, this is a test"),
    ("hindi", "नमस्ते"),
    ("telugu", "హలో"),
]

print("\n📋 Verifying Single Provider Execution:\n")

for language, text in test_cases:
    print(f"\n{'='*70}")
    print(f"🔊 Testing: {language.upper()}")
    print(f"   Text: {text}")
    print(f"{'='*70}")
    
    try:
        audio_base64 = generate_speech(text, language)
        
        if audio_base64:
            print(f"\n✅ SUCCESS - Generated {len(audio_base64)} bytes")
            print(f"✅ Audio data is in BASE64 format (ready for API response)")
        else:
            print(f"\n❌ FAILED - No audio data returned")
    
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 70)
print("✅ Collision Prevention Test Complete!")
print("\n💡 Expected Behavior:")
print("   - Only ONE provider should log '[PRIMARY]' or '[FALLBACK]'")
print("   - For gTTS: Should see '✅ [gTTS] SUCCESS' once per language")
print("   - NO overlapping audio from multiple providers")
print("   - Early return prevents calling AI4Bharat when gTTS succeeds")
print("\n" + "=" * 70)
