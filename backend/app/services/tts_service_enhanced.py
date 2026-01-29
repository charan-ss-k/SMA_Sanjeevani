"""
Enhanced TTS Service for Indian Languages
Uses gTTS as primary provider with AI4Bharat IndicTTS as fallback
- gTTS: Free, reliable, supports all Indian languages (primary)
- AI4Bharat IndicTTS: High-quality Indian language TTS (fallback)
- Coqui TTS: Offline support (last resort)

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
BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY", None)  # Optional, can work without
USE_BHASHINI = True  # Always use Bhashini TTS


def generate_speech_bhashini(text: str, language: str) -> Optional[bytes]:
    """
    Generate speech using gTTS (primary) with AI4Bharat IndicTTS as fallback
    - Primary: gTTS (100% reliable, supports all Indian languages)
    - Fallback: AI4Bharat IndicTTS API (if gTTS fails)
    
    IMPORTANT: Only ONE provider should execute - returns immediately on success
    """
    try:
        lang_code = LANGUAGE_MAP.get(language.lower(), "en")
        
        # ============================================================
        # PRIMARY PROVIDER: gTTS
        # ============================================================
        try:
            from gtts import gTTS
            
            # gTTS language code mapping
            gtts_lang_map = {
                "en": "en",   # English
                "te": "te",   # Telugu
                "hi": "hi",   # Hindi
                "mr": "mr",   # Marathi
                "bn": "bn",   # Bengali
                "ta": "ta",   # Tamil
                "kn": "kn",   # Kannada
                "ml": "ml",   # Malayalam
                "gu": "gu",   # Gujarati
            }
            
            tts_lang = gtts_lang_map.get(lang_code, "en")
            
            logger.info(f"🎤 [gTTS - PRIMARY] Generating speech for {language} (code: {tts_lang})")
            
            # Create gTTS object
            tts = gTTS(text=text, lang=tts_lang, slow=False)
            
            # Save to BytesIO buffer
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            audio_data = audio_buffer.read()
            
            # Try to convert MP3 to WAV (optional, doesn't fail if not available)
            try:
                from pydub import AudioSegment
                audio_segment = AudioSegment.from_mp3(io.BytesIO(audio_data))
                wav_buffer = io.BytesIO()
                audio_segment.export(wav_buffer, format="wav")
                wav_buffer.seek(0)
                audio_data = wav_buffer.read()
                logger.info(f"✅ [gTTS] SUCCESS - Generated {len(audio_data)} bytes (WAV format)")
            except (ImportError, FileNotFoundError):
                # FFmpeg not available, MP3 is fine (browsers support it)
                logger.info(f"✅ [gTTS] SUCCESS - Generated {len(audio_data)} bytes (MP3 format, FFmpeg not available)")
            except Exception as e:
                # Any other error during conversion, still return MP3
                logger.debug(f"⚠️ MP3→WAV conversion skipped: {e}")
                logger.info(f"✅ [gTTS] SUCCESS - Generated {len(audio_data)} bytes (MP3 format)")
            
            # Return immediately - gTTS succeeded
            return audio_data
            
        except ImportError:
            logger.warning("⚠️ [gTTS] Not installed, trying fallback...")
        except Exception as gtts_error:
            logger.warning(f"⚠️ [gTTS] Failed: {gtts_error}")
        
        # ============================================================
        # FALLBACK PROVIDER: AI4Bharat IndicTTS
        # ============================================================
        logger.info(f"🎤 [AI4Bharat - FALLBACK] Attempting AI4Bharat IndicTTS for {language}")
        
        # Map to IndicTTS language codes
        indic_lang_map = {
            "en": "english",
            "te": "telugu",
            "hi": "hindi",
            "mr": "marathi",
            "bn": "bengali",
            "ta": "tamil",
            "kn": "kannada",
            "ml": "malayalam",
            "gu": "gujarati",
        }
        
        lang_name = indic_lang_map.get(lang_code, "english")
        
        # Truncate text if too long
        max_length = 500
        if len(text) > max_length:
            text = text[:max_length]
            logger.warning(f"⚠️ [AI4Bharat] Text truncated to {max_length} characters")
        
        payload = {
            "input": text,
            "language": lang_name,
            "gender": "female",
            "speed": 1.0
        }
        
        headers = {"Content-Type": "application/json"}
        
        response = requests.post(
            "https://tts-api.ai4bharat.org/synthesize",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Check for audio URL
            if "audio_url" in result:
                audio_url = result["audio_url"]
                audio_response = requests.get(audio_url, timeout=30)
                if audio_response.status_code == 200:
                    audio_data = audio_response.content
                    logger.info(f"✅ [AI4Bharat] SUCCESS - Generated {len(audio_data)} bytes")
                    return audio_data
            
            # Check for base64 audio
            elif "audio" in result:
                audio_b64 = result["audio"]
                audio_data = base64.b64decode(audio_b64)
                logger.info(f"✅ [AI4Bharat] SUCCESS - Generated {len(audio_data)} bytes")
                return audio_data
            
            logger.warning(f"⚠️ [AI4Bharat] No audio in response: {result}")
            return None
        else:
            logger.warning(f"⚠️ [AI4Bharat] API error {response.status_code}: {response.text[:200]}")
            return None
            
    except Exception as e:
        logger.error(f"❌ [TTS] Unexpected error: {e}")
        return None


# Deprecated: Google Cloud TTS removed (using only Bhashini)
# def generate_speech_google(text: str, language: str) -> Optional[bytes]:
#     """
#     Generate speech using Google Cloud Text-to-Speech API
#     Requires GOOGLE_TTS_API_KEY in environment
#     """
#     if not GOOGLE_TTS_API_KEY:
#         logger.debug("Google TTS API key not configured")
#         return None
#     ...

# Deprecated: gTTS removed (using only Bhashini)
# def generate_speech_gtts(text: str, language: str) -> Optional[bytes]:
#     """
#     Generate speech using gTTS (Google Text-to-Speech) - Free, simple, reliable
#     """
#     try:
#         from gtts import gTTS
#         import tempfile
#         ...
#     except Exception as e:
#         logger.warning(f"⚠️ [gTTS] Error: {e}")
#         return None


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
    Primary: gTTS (reliable, supports all Indian languages)
    Fallback: AI4Bharat IndicTTS > Coqui TTS
    
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
    
    # Try gTTS/AI4Bharat (primary - reliable for all Indian languages)
    if USE_BHASHINI:
        audio_data = generate_speech_bhashini(text, language)
        if audio_data:
            provider = "gTTS/AI4Bharat"
    
    # Fallback to Coqui TTS if primary fails
    if not audio_data:
        logger.warning("⚠️ gTTS/AI4Bharat TTS failed, falling back to Coqui TTS")
        audio_data = generate_speech_coqui(text, language)
        if audio_data:
            provider = "Coqui"
    
    if not audio_data:
        logger.error("❌ All TTS providers failed")
        return None
    
    # Ensure WAV format
    if not audio_data.startswith(b'RIFF'):  # WAV header check
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
