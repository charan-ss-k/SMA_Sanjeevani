"""
Indic Parler-TTS Service
Native language audio synthesis for Indian languages using Parler-TTS
Supports: Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Malayalam, Gujarati, English
"""

import os
import io
import base64
import logging
from typing import Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

# Language to Parler-TTS language code mapping
PARLER_LANGUAGE_MAP = {
    "english": "en",
    "hindi": "hi",
    "telugu": "te",
    "tamil": "ta",
    "marathi": "mr",
    "bengali": "bn",
    "kannada": "kn",
    "malayalam": "ml",
    "gujarati": "gu",
}

# Parler TTS voice presets for each language
PARLER_VOICE_PRESETS = {
    "en": {"speaker": "goofy", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "hi": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "te": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "ta": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "mr": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "bn": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "kn": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "ml": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
    "gu": {"speaker": "neutral", "pitch": 1.0, "speed": 1.0, "emotion": "neutral"},
}


class ParlerTTSService:
    """Indic Parler-TTS for native language audio synthesis"""
    
    def __init__(self):
        self.model = None
        self.device = None
        self.tokenizer = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize Parler-TTS model"""
        try:
            import torch
            from transformers import AutoTokenizer, AutoModelForCausalLM
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"🎤 Initializing Parler-TTS on device: {self.device}")
            
            # Model identifier for Parler-TTS
            model_name = "parler-tts/parler_tts"
            
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                self.model = AutoModelForCausalLM.from_pretrained(model_name)
                self.model.to(self.device)
                logger.info("✅ Parler-TTS model initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️ Failed to load Parler-TTS model: {e}")
                self.model = None
                
        except ImportError as e:
            logger.warning(f"⚠️ Torch or transformers not installed: {e}")
            logger.info("💡 Install with: pip install torch transformers")
            self.model = None
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize Parler-TTS: {e}")
            self.model = None
    
    def generate_audio(
        self,
        text: str,
        language: str = "english",
        speaker: str = "neutral",
        emotion: str = "neutral"
    ) -> Optional[bytes]:
        """
        Generate audio using Parler-TTS
        
        Args:
            text: Text to synthesize
            language: Target language code (e.g., 'hi', 'te', 'en')
            speaker: Speaker identifier
            emotion: Emotion/tone for synthesis
            
        Returns:
            Audio bytes (WAV format) or None if failed
        """
        if not self.model:
            logger.warning("⚠️ Parler-TTS model not available, falling back to gTTS")
            return None
        
        try:
            import torch
            from scipy.io import wavfile
            
            # Get language code
            lang_code = PARLER_LANGUAGE_MAP.get(language.lower(), "en")
            
            # Get voice preset for language
            voice_preset = PARLER_VOICE_PRESETS.get(lang_code, PARLER_VOICE_PRESETS["en"])
            
            # Build description string for Parler-TTS
            description = f"{speaker} {emotion}"
            
            logger.info(f"🎤 Generating audio: {language} ({lang_code}) - {description}")
            
            # Prepare prompt for model
            prompt = f"<s>[SPEAKER] {description}\n{text}"
            
            # Tokenize and generate
            with torch.no_grad():
                input_ids = self.tokenizer(prompt, return_tensors="pt").input_ids.to(self.device)
                generation_config = {
                    "max_new_tokens": 1024,
                    "top_k": 250,
                    "top_p": 0.95,
                    "temperature": 1.0,
                    "repetition_penalty": 1.0,
                }
                output = self.model.generate(input_ids, **generation_config)
                audio = output.cpu().squeeze().numpy()
            
            # Save audio to bytes buffer
            buffer = io.BytesIO()
            wavfile.write(buffer, 22050, audio.astype("int16"))  # 22.05kHz sample rate
            audio_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info(f"✅ Audio generated successfully ({len(audio_bytes)} bytes)")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"❌ Parler-TTS generation failed: {e}")
            return None
    
    def text_to_speech(
        self,
        text: str,
        language: str = "english",
        output_format: str = "base64"
    ) -> Optional[str]:
        """
        Convert text to speech and return as base64 or bytes
        
        Args:
            text: Text to synthesize
            language: Language code
            output_format: 'base64' or 'bytes'
            
        Returns:
            Base64 encoded audio or raw bytes, or None if failed
        """
        audio_bytes = self.generate_audio(text, language)
        
        if not audio_bytes:
            logger.warning(f"⚠️ Failed to generate audio for: {text[:50]}...")
            return None
        
        if output_format == "base64":
            return base64.b64encode(audio_bytes).decode("utf-8")
        else:
            return audio_bytes


# Global instance
_parler_service: Optional[ParlerTTSService] = None


def get_parler_tts_service() -> ParlerTTSService:
    """Get or create Parler TTS service singleton"""
    global _parler_service
    if _parler_service is None:
        _parler_service = ParlerTTSService()
    return _parler_service


def generate_parler_tts_audio(
    text: str,
    language: str = "english",
    speaker: str = "neutral",
    emotion: str = "neutral",
    output_format: str = "base64"
) -> Optional[str]:
    """
    Convenience function to generate audio using Parler-TTS
    
    Args:
        text: Text to synthesize
        language: Target language
        speaker: Speaker identifier
        emotion: Emotion/tone
        output_format: Output format ('base64' or 'bytes')
        
    Returns:
        Audio data or None if failed
    """
    service = get_parler_tts_service()
    
    if output_format == "base64":
        return service.text_to_speech(text, language, "base64")
    else:
        audio_bytes = service.generate_audio(text, language, speaker, emotion)
        if audio_bytes:
            return base64.b64encode(audio_bytes).decode("utf-8")
        return None


def generate_speech_batch(
    texts: list,
    language: str = "english",
    speaker: str = "neutral",
    emotion: str = "neutral"
) -> list:
    """
    Generate audio for multiple text inputs
    
    Args:
        texts: List of text strings
        language: Target language
        speaker: Speaker identifier
        emotion: Emotion/tone
        
    Returns:
        List of base64 encoded audio strings
    """
    service = get_parler_tts_service()
    results = []
    
    for text in texts:
        try:
            audio = service.text_to_speech(text, language, "base64")
            results.append(audio)
        except Exception as e:
            logger.error(f"Error generating audio for '{text[:30]}...': {e}")
            results.append(None)
    
    return results
