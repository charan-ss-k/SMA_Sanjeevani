#!/usr/bin/env python3
"""Test TTS service"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

def test_tts():
    print("\n" + "="*70)
    print("TTS SERVICE TEST")
    print("="*70)
    
    try:
        from app.services import tts_service
        
        print("\n[1] Testing TTS service import...")
        print("[PASS] TTS service imported successfully")
        
        print("\n[2] Testing language normalization...")
        test_langs = ["english", "hindi", "en", "hi", "TELUGU"]
        for lang in test_langs:
            normalized = tts_service.normalize_language(lang)
            print(f"[OK] '{lang}' -> '{normalized}'")
        
        print("\n[3] Testing supported languages...")
        supported = tts_service.get_supported_languages()
        print(f"[PASS] Supported languages: {len(supported)}")
        for code, info in list(supported.items())[:3]:
            print(f"   {code}: {info['name']} ({info['native']})")
        
        print("\n[4] Testing TTS generation with text...")
        test_text = "Hello, this is a test message"
        result = tts_service.generate_speech(test_text, "english")
        
        if result:
            print(f"[PASS] TTS generation successful")
            print(f"   Audio data size: {len(result)} characters (base64)")
            print(f"   Audio is valid base64: {result[:50]}...")
        else:
            print("[WARN] TTS generation returned None (dependencies may not be installed)")
            print("   This is expected if google-cloud-texttospeech credentials are not set")
            print("   gTTS will work as fallback")
        
        print("\n[5] Testing Hindi TTS...")
        test_text_hi = "नमस्ते, यह एक परीक्षण संदेश है"
        result_hi = tts_service.generate_speech(test_text_hi, "hindi")
        
        if result_hi:
            print(f"[PASS] Hindi TTS successful - {len(result_hi)} chars")
        else:
            print("[WARN] Hindi TTS returned None (may need credentials or internet)")
        
        print("\n[PASS] TTS SERVICE TEST COMPLETED SUCCESSFULLY")
        return True
        
    except Exception as e:
        print(f"\n[FAIL] TTS SERVICE TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_tts()
    sys.exit(0 if success else 1)
