"""
Test script for Translation + TTS Pipeline
Tests: Phi-4 English → Translation → TTS
"""

import sys
sys.path.insert(0, 'd:\\GitHub 2\\SMA_Sanjeevani\\backend')

from app.services.translation import translate_text, translate_response
from app.services.tts import generate_audio, generate_tts_payload

print("=" * 70)
print("TESTING TRANSLATION + TTS PIPELINE")
print("=" * 70)

# Test 1: Simple text translation
print("\n1️⃣ Testing Text Translation")
print("-" * 70)

english_text = "You have a fever. Take rest and drink plenty of water."
print(f"English: {english_text}")

for lang in ['hindi', 'telugu', 'tamil']:
    translated = translate_text(english_text, lang)
    print(f"{lang.title()}: {translated}")

# Test 2: JSON response translation
print("\n2️⃣ Testing JSON Response Translation")
print("-" * 70)

sample_response = {
    "predicted_condition": "Common Cold with Fever",
    "home_care_advice": [
        "Drink plenty of warm fluids",
        "Take rest for 2-3 days",
        "Use steam inhalation"
    ],
    "doctor_consultation_advice": "Consult a doctor if fever persists for more than 3 days",
    "recommended_medicines": [
        {
            "name": "Paracetamol 500mg",
            "dosage": "1 tablet",
            "frequency": "twice daily",
            "duration": "3 days",
            "instructions": "Take after food"
        }
    ]
}

print("Original (English):")
print(sample_response)

translated_response = translate_response(sample_response, 'hindi')
print("\nTranslated (Hindi):")
print(translated_response)

# Test 3: TTS Generation
print("\n3️⃣ Testing TTS Audio Generation")
print("-" * 70)

hindi_text = translated_response['predicted_condition']
print(f"Generating audio for: {hindi_text}")

audio_file = generate_audio(hindi_text, 'hindi')
print(f"✅ Audio saved to: {audio_file}")

# Test 4: Complete TTS Payload
print("\n4️⃣ Testing Complete TTS Payload")
print("-" * 70)

tts_payload = generate_tts_payload(translated_response, 'hindi')
print(f"Generated {len(tts_payload['audio_files'])} audio files:")
for key, audio in tts_payload['audio_files'].items():
    print(f"  - {key}: {len(audio)} bytes (base64)")

print("\n" + "=" * 70)
print("✅ ALL TESTS COMPLETED")
print("=" * 70)

print("\n📝 Pipeline Summary:")
print("  1. Phi-4 generates response in English")
print("  2. googletrans translates English → Native language")
print("  3. gTTS generates audio in Native language")
print("  4. Frontend receives translated text + audio")
