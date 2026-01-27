"""
TTS Service for SMA Sanjeevani - PRODUCTION READY
Uses Google Cloud Text-to-Speech (best quality) with gTTS fallback
Supports: English, Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Malayalam, Gujarati
"""

import os
import io
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Google Cloud TTS voice mapping for Indian languages
GOOGLE_VOICE_MAP = {
    "en": "en-US-Neural2-C",
    "english": "en-US-Neural2-C",
    "hi": "hi-IN-Neural2-A",
    "hindi": "hi-IN-Neural2-A",
    "te": "te-IN-Standard-A",
    "telugu": "te-IN-Standard-A",
    "ta": "ta-IN-Standard-A",
    "tamil": "ta-IN-Standard-A",
    "mr": "mr-IN-Standard-A",
    "marathi": "mr-IN-Standard-A",
    "bn": "bn-IN-Standard-A",
    "bengali": "bn-IN-Standard-A",
    "kn": "kn-IN-Standard-A",
    "kannada": "kn-IN-Standard-A",
    "ml": "ml-IN-Standard-A",
    "malayalam": "ml-IN-Standard-A",
    "gu": "gu-IN-Standard-A",
    "gujarati": "gu-IN-Standard-A",
}

# ISO language code mapping
LANG_ISO_MAP = {
    "en": "en",
    "english": "en",
    "hi": "hi",
    "hindi": "hi",
    "te": "te",
    "telugu": "te",
    "ta": "ta",
    "tamil": "ta",
    "mr": "mr",
    "marathi": "mr",
    "bn": "bn",
    "bengali": "bn",
    "kn": "kn",
    "kannada": "kn",
    "ml": "ml",
    "malayalam": "ml",
    "gu": "gu",
    "gujarati": "gu",
}

SUPPORTED_LANGUAGES = ["en", "hi", "te", "ta", "mr", "bn", "kn", "ml", "gu"]


def normalize_language(lang: str) -> str:
    """Normalize language code"""
    lang_lower = lang.lower().strip()
    return LANG_ISO_MAP.get(lang_lower, "en")


def get_voice_for_language(lang: str) -> str:
    """Get Google Cloud voice for language"""
    lang_norm = normalize_language(lang)
    return GOOGLE_VOICE_MAP.get(lang_norm, GOOGLE_VOICE_MAP["en"])


def generate_speech_google_cloud(text: str, language: str) -> Optional[bytes]:
    """
    Generate speech using Google Cloud Text-to-Speech API
    Best quality option - professional, natural sounding voices
    """
    try:
        from google.cloud import texttospeech
        
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        voice_name = get_voice_for_language(language)
        lang_parts = voice_name.split("-")
        lang_code = f"{lang_parts[0]}-{lang_parts[1]}"
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=lang_code,
            name=voice_name
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,
            pitch=0.0
        )
        
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        logger.info(f"[Google Cloud TTS] Generated {len(response.audio_content)} bytes for '{language}'")
        return response.audio_content
        
    except Exception as e:
        logger.warning(f"[Google Cloud TTS] Failed: {e}")
        return None


def generate_speech_gtts(text: str, language: str) -> Optional[bytes]:
    """
    Generate speech using gTTS (Google Translate TTS)
    Free fallback - works without API keys but lower quality than Google Cloud
    """
    try:
        from gtts import gTTS
        
        lang_code = normalize_language(language)
        tts = gTTS(text=text, lang=lang_code, slow=False)
        
        mp3_buffer = io.BytesIO()
        tts.write_to_fp(mp3_buffer)
        mp3_buffer.seek(0)
        audio_bytes = mp3_buffer.read()
        
        logger.info(f"[gTTS] Generated {len(audio_bytes)} bytes for '{language}'")
        return audio_bytes
        
    except Exception as e:
        logger.warning(f"[gTTS] Failed: {e}")
        return None


def generate_speech(text: str, language: str = "english") -> Optional[str]:
    """
    Generate speech with automatic fallback
    
    Args:
        text: Text to convert to speech
        language: Language code or name
    
    Returns:
        Base64 encoded audio (MP3) or None
    """
    if not text or not text.strip():
        logger.warning("[TTS] Empty text provided")
        return None
    
    if len(text) > 5000:
        text = text[:5000]
        logger.warning("[TTS] Text truncated to 5000 characters")
    
    lang = normalize_language(language)
    logger.info(f"[TTS] Generating speech for language: {lang}")
    
    # Try Google Cloud TTS first (best quality)
    logger.info("[TTS] Trying Google Cloud Text-to-Speech...")
    audio_data = generate_speech_google_cloud(text, lang)
    
    if audio_data:
        try:
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")
            return audio_base64
        except Exception as e:
            logger.error(f"[TTS] Error encoding Google Cloud audio: {e}")
    
    # Fallback to gTTS
    logger.info("[TTS] Trying gTTS fallback...")
    audio_data = generate_speech_gtts(text, lang)
    
    if audio_data:
        try:
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")
            return audio_base64
        except Exception as e:
            logger.error(f"[TTS] Error encoding gTTS audio: {e}")
    
    logger.error("[TTS] All TTS providers failed - install google-cloud-texttospeech or gtts")
    return None


def get_supported_languages() -> dict:
    """Get list of supported languages"""
    return {
        "en": {"name": "English", "native": "English"},
        "hi": {"name": "Hindi", "native": "हिन्दी"},
        "te": {"name": "Telugu", "native": "తెలుగు"},
        "ta": {"name": "Tamil", "native": "தமிழ்"},
        "mr": {"name": "Marathi", "native": "मराठी"},
        "bn": {"name": "Bengali", "native": "বাংলা"},
        "kn": {"name": "Kannada", "native": "ಕನ್ನಡ"},
        "ml": {"name": "Malayalam", "native": "മലയാളം"},
        "gu": {"name": "Gujarati", "native": "ગુજરાતી"},
    }


def validate_language(language: str) -> bool:
    """Check if language is supported"""
    return normalize_language(language) in SUPPORTED_LANGUAGES
