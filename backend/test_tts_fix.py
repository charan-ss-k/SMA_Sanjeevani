"""
Test script to verify TTS functionality after the fix
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("🔧 Testing TTS Service Fix...")
print("=" * 60)

# Import TTS service
from app.services.tts_service_enhanced import generate_speech

# Test languages
test_languages = [
    ("english", "Hello, this is a test"),
    ("hindi", "नमस्ते, यह एक परीक्षण है"),
    ("telugu", "హలో, ఇది ఒక పరీక్ష"),
]

print("\n📋 Testing TTS Generation:\n")

for language, text in test_languages:
    print(f"\n🔊 Testing {language.upper()}:")
    print(f"   Text: {text}")
    
    try:
        audio_base64 = generate_speech(text, language)
        
        if audio_base64:
            print(f"   ✅ SUCCESS - Generated {len(audio_base64)} bytes of audio data")
        else:
            print(f"   ❌ FAILED - No audio data returned")
    
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("✅ TTS Test Complete!")
print("\n💡 If all tests passed, TTS is working correctly.")
print("   The fix uses gTTS as primary provider with AI4Bharat fallback.")
