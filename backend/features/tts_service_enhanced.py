"""
Enhanced TTS Service for Indian Languages
Supports multiple TTS providers with automatic fallback:
1. Bhashini TTS (Primary) - Free, government-backed, excellent for Indian languages
2. Google Cloud TTS (Secondary) - Best quality, requires API key
3. gTTS (Fallback) - Simple, free, reliable
4. Coqui TTS (Legacy) - If others fail

Supports: English, Telugu, Hindi, Marathi, Bengali, Tamil, Kannada, Malayalam, Gujarati
"""
import os
import io
import base64
import logging
import tempfile
from typing import Optional
import requests

logger = logging.getLogger(__name__)

# Language to ISO 639-1 code mapping
LANGUAGE_MAP = {
    "english": "en",
    "telugu": "te",
    "hindi": "hi",
    "marathi": "mr",
    "bengali": "bn",
    "tamil": "ta",
    "kannada": "kn",
    "malayalam": "ml",
    "gujarati": "gu",
    "en": "en",
    "te": "te",
    "hi": "hi",
    "mr": "mr",
    "bn": "bn",
    "ta": "ta",
    "kn": "kn",
    "ml": "ml",
    "gu": "gu",
}

# Bhashini TTS language code mapping (uses ISO 639-1)
BHASHINI_LANG_MAP = {
    "en": "en",
    "te": "te",
    "hi": "hi",
    "mr": "mr",
    "bn": "bn",
    "ta": "ta",
    "kn": "kn",
    "ml": "ml",
    "gu": "gu",
}

# Google Cloud TTS voice mapping for Indian languages
GOOGLE_VOICE_MAP = {
    "en": "en-US-Neural2-D",
    "te": "te-IN-Standard-A",
    "hi": "hi-IN-Neural2-D",
    "mr": "mr-IN-Neural2-A",
    "bn": "bn-IN-Standard-A",
    "ta": "ta-IN-Standard-A",
    "kn": "kn-IN-Standard-A",
    "ml": "ml-IN-Standard-A",
    "gu": "gu-IN-Standard-A",
}

# Supported languages
SUPPORTED_LANGUAGES = {
    "english": {"name": "English", "code": "en", "flag": "🇬🇧"},
    "telugu": {"name": "తెలుగు (Telugu)", "code": "te", "flag": "🇮🇳"},
    "hindi": {"name": "हिन्दी (Hindi)", "code": "hi", "flag": "🇮🇳"},
    "marathi": {"name": "मराठी (Marathi)", "code": "mr", "flag": "🇮🇳"},
    "bengali": {"name": "বাংলা (Bengali)", "code": "bn", "flag": "🇮🇳"},
    "tamil": {"name": "தமிழ் (Tamil)", "code": "ta", "flag": "🇮🇳"},
    "kannada": {"name": "ಕನ್ನಡ (Kannada)", "code": "kn", "flag": "🇮🇳"},
    "malayalam": {"name": "മലയാളം (Malayalam)", "code": "ml", "flag": "🇮🇳"},
    "gujarati": {"name": "ગુજરાતી (Gujarati)", "code": "gu", "flag": "🇮🇳"},
}

# Configuration from environment
GOOGLE_TTS_API_KEY = os.getenv("GOOGLE_TTS_API_KEY", None)
BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY", None)  # Optional, can work without
USE_BHASHINI = os.getenv("USE_BHASHINI_TTS", "true").lower() == "true"
USE_GOOGLE = os.getenv("USE_GOOGLE_TTS", "false").lower() == "true"
USE_GTTS = os.getenv("USE_GTTS", "true").lower() == "true"


def generate_speech_bhashini(text: str, language: str) -> Optional[bytes]:
    """
    Generate speech using Bhashini TTS API (Free, excellent for Indian languages)
    API Documentation: https://bhashini.gov.in/
    """
    try:
        lang_code = LANGUAGE_MAP.get(language.lower(), "en")
        
        # Bhashini TTS API endpoint (public API, no key required for basic usage)
        # Using the Bhashini inference API
        url = "https://tts-api.ai4bharat.org/inference"
        
        # Map to Bhashini language names
        bhashini_lang_map = {
            "en": "English",
            "te": "Telugu",
            "hi": "Hindi",
            "mr": "Marathi",
            "bn": "Bengali",
            "ta": "Tamil",
            "kn": "Kannada",
            "ml": "Malayalam",
            "gu": "Gujarati",
        }
        
        lang_name = bhashini_lang_map.get(lang_code, "English")
        
        # Bhashini TTS API v2 endpoint
        url = "https://tts.bhashini.ai/v2/synthesize"
        
        # Truncate text if too long (250 chars without API key)
        max_length = 250 if not BHASHINI_API_KEY else 5000
        if len(text) > max_length:
            text = text[:max_length]
            logger.warning(f"⚠️ [Bhashini] Text truncated to {max_length} characters")
        
        payload = {
            "text": text,
            "language": lang_name,
            "voiceName": "Female1"  # Can be "Female1", "Female2", "Male1", "Male2"
        }
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "audio/wav"
        }
        
        # Add API key if available
        if BHASHINI_API_KEY:
            headers["X-API-KEY"] = BHASHINI_API_KEY
        
        logger.info(f"🎤 [Bhashini] Generating speech for {language} (code: {lang_code}, name: {lang_name})")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            audio_data = response.content
            logger.info(f"✅ [Bhashini] Speech generated successfully ({len(audio_data)} bytes)")
            return audio_data
        else:
            logger.warning(f"⚠️ [Bhashini] API returned status {response.status_code}: {response.text[:200]}")
            return None
            
    except Exception as e:
        logger.warning(f"⚠️ [Bhashini] Error: {e}")
        return None


def generate_speech_google(text: str, language: str) -> Optional[bytes]:
    """
    Generate speech using Google Cloud Text-to-Speech API
    Requires GOOGLE_TTS_API_KEY in environment
    """
    if not GOOGLE_TTS_API_KEY:
        logger.debug("Google TTS API key not configured")
        return None
    
    try:
        from google.cloud import texttospeech
        
        lang_code = LANGUAGE_MAP.get(language.lower(), "en")
        voice_name = GOOGLE_VOICE_MAP.get(lang_code, "en-US-Neural2-D")
        
        client = texttospeech.TextToSpeechClient()
        
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=f"{lang_code}-IN" if lang_code != "en" else "en-US",
            name=voice_name,
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,
            sample_rate_hertz=24000,
            speaking_rate=1.0,
            pitch=0.0
        )
        
        logger.info(f"🎤 [Google] Generating speech for {language} (voice: {voice_name})")
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        audio_data = response.audio_content
        logger.info(f"✅ [Google] Speech generated successfully ({len(audio_data)} bytes)")
        return audio_data
        
    except ImportError:
        logger.warning("⚠️ [Google] google-cloud-texttospeech not installed. Install with: pip install google-cloud-texttospeech")
        return None
    except Exception as e:
        logger.warning(f"⚠️ [Google] Error: {e}")
        return None


def generate_speech_gtts(text: str, language: str) -> Optional[bytes]:
    """
    Generate speech using gTTS (Google Text-to-Speech) - Free, simple, reliable
    """
    try:
        from gtts import gTTS
        import tempfile
        
        lang_code = LANGUAGE_MAP.get(language.lower(), "en")
        
        # gTTS uses language codes directly
        tts = gTTS(text=text, lang=lang_code, slow=False)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            temp_path = tmp_file.name
        
        logger.info(f"🎤 [gTTS] Generating speech for {language} (code: {lang_code})")
        tts.save(temp_path)
        
        # Read audio data
        with open(temp_path, 'rb') as f:
            audio_data = f.read()
        
        # Clean up
        os.unlink(temp_path)
        
        logger.info(f"✅ [gTTS] Speech generated successfully ({len(audio_data)} bytes)")
        return audio_data
        
    except ImportError:
        logger.warning("⚠️ [gTTS] gTTS not installed. Install with: pip install gtts")
        return None
    except Exception as e:
        logger.warning(f"⚠️ [gTTS] Error: {e}")
        return None


def generate_speech_coqui(text: str, language: str) -> Optional[bytes]:
    """
    Generate speech using Coqui TTS (Legacy fallback)
    """
    try:
        from TTS.api import TTS
        
        lang_code = LANGUAGE_MAP.get(language.lower(), "en")
        
        logger.info(f"🎤 [Coqui] Initializing TTS for {language} (code: {lang_code})")
        tts = TTS(model_name="tts_models/multilingual/multi_dataset/xtts_v2", gpu=False)
        
        # Generate to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            temp_path = tmp_file.name
        
        tts.tts_to_file(
            text=text,
            file_path=temp_path,
            language=lang_code,
            speaker_wav=None
        )
        
        # Read audio data
        with open(temp_path, 'rb') as f:
            audio_data = f.read()
        
        # Clean up
        os.unlink(temp_path)
        
        logger.info(f"✅ [Coqui] Speech generated successfully ({len(audio_data)} bytes)")
        return audio_data
        
    except ImportError:
        logger.warning("⚠️ [Coqui] Coqui TTS not installed")
        return None
    except Exception as e:
        logger.warning(f"⚠️ [Coqui] Error: {e}")
        return None


def convert_audio_to_wav(audio_data: bytes, input_format: str = "mp3") -> Optional[bytes]:
    """
    Convert audio from MP3/other formats to WAV
    """
    try:
        from pydub import AudioSegment
        import io
        
        # Load audio
        if input_format == "mp3":
            audio = AudioSegment.from_mp3(io.BytesIO(audio_data))
        else:
            audio = AudioSegment.from_file(io.BytesIO(audio_data))
        
        # Convert to WAV
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_data = wav_buffer.getvalue()
        
        return wav_data
    except ImportError:
        logger.warning("⚠️ pydub not installed for audio conversion")
        return audio_data  # Return original if conversion fails
    except Exception as e:
        logger.warning(f"⚠️ Audio conversion error: {e}")
        return audio_data  # Return original if conversion fails


def generate_speech(text: str, language: str = "english") -> Optional[str]:
    """
    Generate speech audio from text using best available TTS provider
    Tries providers in order: Bhashini > Google > gTTS > Coqui
    
    Args:
        text: Text to convert to speech
        language: Language code (e.g., 'english', 'hindi', 'telugu')
    
    Returns:
        Base64 encoded audio data (WAV format), or None if generation fails
    """
    if not text or not text.strip():
        logger.warning("Empty text provided to TTS")
        return None
    
    lang_code = LANGUAGE_MAP.get(language.lower(), "en")
    logger.info(f"🎤 Generating speech for language: {language} (code: {lang_code})")
    logger.info(f"📝 Text: {text[:100]}...")
    
    audio_data = None
    provider = None
    
    # Try providers in order of preference
    if USE_BHASHINI:
        audio_data = generate_speech_bhashini(text, language)
        if audio_data:
            provider = "Bhashini"
    
    if not audio_data and USE_GOOGLE and GOOGLE_TTS_API_KEY:
        audio_data = generate_speech_google(text, language)
        if audio_data:
            provider = "Google Cloud"
    
    if not audio_data and USE_GTTS:
        audio_data = generate_speech_gtts(text, language)
        if audio_data:
            provider = "gTTS"
            # Convert MP3 to WAV
            audio_data = convert_audio_to_wav(audio_data, "mp3")
    
    if not audio_data:
        # Last resort: Coqui TTS
        audio_data = generate_speech_coqui(text, language)
        if audio_data:
            provider = "Coqui"
    
    if not audio_data:
        logger.error("❌ All TTS providers failed")
        return None
    
    # Ensure WAV format
    if provider in ["gTTS"]:
        # Already converted above
        pass
    elif not audio_data.startswith(b'RIFF'):  # WAV header check
        # Try to convert if not WAV
        audio_data = convert_audio_to_wav(audio_data)
    
    # Encode to base64
    audio_base64 = base64.b64encode(audio_data).decode("utf-8")
    logger.info(f"✅ Speech generated successfully using {provider} ({len(audio_data)} bytes)")
    
    return audio_base64


def get_supported_languages():
    """Return list of supported languages with metadata"""
    return SUPPORTED_LANGUAGES


def validate_language(language: str) -> bool:
    """Check if language is supported"""
    return language.lower() in LANGUAGE_MAP
