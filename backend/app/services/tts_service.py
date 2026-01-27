"""
Coqui TTS Service for multi-language text-to-speech
Supports: English, Telugu, Hindi, Marathi, Bengali, Tamil, Kannada, Malayalam, Gujarati
"""
import io
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy import - don't load TTS at module level to avoid numpy conflicts
TTS = None

# Language to Coqui TTS language code mapping
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

# Supported Indian languages
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

# Global TTS instance (lazy loaded)
_tts_instance = None
_current_language = "en"


def initialize_tts():
    """Initialize the TTS model on first use (lazy loading)"""
    global _tts_instance, TTS
    if _tts_instance is None:
        if TTS is None:
            # Import TTS only when needed to avoid numpy conflicts
            try:
                from TTS.api import TTS as TTSModule
                TTS = TTSModule
            except ImportError as e:
                logger.error(f"Coqui TTS not installed. Install with: pip install coqui-tts. Error: {e}")
                return False
            except Exception as e:
                logger.error(f"Error importing Coqui TTS (possible numpy version conflict): {e}")
                logger.info("Try: pip install --upgrade numpy scikit-learn pandas librosa")
                return False
        try:
            logger.info("Initializing Coqui TTS...")
            _tts_instance = TTS(model_name="tts_models/multilingual/multi_dataset/xtts_v2", gpu=False)
            logger.info("✓ Coqui TTS initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Coqui TTS: {e}")
            logger.info("This is usually a numpy/sklearn version conflict. Try:")
            logger.info("  pip install --upgrade numpy scikit-learn pandas librosa")
            return False
    return True


def generate_speech(text: str, language: str = "english") -> Optional[str]:
    """
    Generate speech audio from text using Coqui TTS
    
    Args:
        text: Text to convert to speech
        language: Language code (e.g., 'english', 'hindi', 'telugu')
    
    Returns:
        Base64 encoded audio data (WAV format), or None if generation fails
    """
    if not initialize_tts():
        logger.error("TTS not available")
        return None
    
    try:
        # Normalize language
        lang_code = LANGUAGE_MAP.get(language.lower(), "en")
        
        logger.info(f"Generating speech for language: {language} (code: {lang_code})")
        logger.info(f"Text: {text[:100]}...")
        
        # Generate speech
        output_path = f"/tmp/tts_output_{lang_code}.wav"
        _tts_instance.tts_to_file(
            text=text,
            file_path=output_path,
            language=lang_code,
            speaker_wav=None,  # Use default speaker
        )
        
        # Read and encode as base64
        with open(output_path, "rb") as f:
            audio_data = f.read()
        
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")
        logger.info(f"✓ Speech generated successfully ({len(audio_data)} bytes)")
        
        return audio_base64
        
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_supported_languages():
    """Return list of supported languages with metadata"""
    return SUPPORTED_LANGUAGES


def validate_language(language: str) -> bool:
    """Check if language is supported"""
    return language.lower() in LANGUAGE_MAP
