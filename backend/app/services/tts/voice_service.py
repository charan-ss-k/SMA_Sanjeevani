"""
Text-to-Speech Service using gTTS
Converts translated text to audio in native languages
"""

import logging
import os
import tempfile
from pathlib import Path
from typing import Dict, Optional
import base64

from gtts import gTTS

logger = logging.getLogger(__name__)


class VoiceService:
    """Handles text-to-speech generation in multiple languages"""
    
    # gTTS language codes
    GTTS_LANG_MAP = {
        'english': 'en',
        'hindi': 'hi',
        'telugu': 'te',
        'tamil': 'ta',
        'kannada': 'kn',
        'malayalam': 'ml',
        'bengali': 'bn',
        'gujarati': 'gu',
        'marathi': 'mr'
    }
    
    def __init__(self, output_dir: Optional[str] = None):
        """
        Initialize Voice Service
        
        Args:
            output_dir: Directory to save audio files (optional)
        """
        self.output_dir = output_dir or tempfile.gettempdir()
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"✅ Voice service initialized (output: {self.output_dir})")
    
    def text_to_speech(self, text: str, language: str, slow: bool = False) -> str:
        """
        Convert text to speech audio file
        
        Args:
            text: Text to convert
            language: Language name (e.g., 'hindi', 'telugu')
            slow: Slow down speech (default: False)
        
        Returns:
            Path to generated audio file
        """
        if not text or not text.strip():
            logger.warning("⚠️ Empty text provided for TTS")
            return None
        
        # Get language code
        lang_code = self.GTTS_LANG_MAP.get(language.lower(), 'en')
        
        try:
            logger.info(f"🔊 Generating speech in {language} ({lang_code})...")
            
            # Generate audio using gTTS
            tts = gTTS(text=text, lang=lang_code, slow=slow)
            
            # Save to file
            filename = f"tts_{language}_{hash(text) % 100000}.mp3"
            filepath = os.path.join(self.output_dir, filename)
            
            tts.save(filepath)
            logger.info(f"✅ Audio saved: {filepath}")
            
            return filepath
        
        except Exception as e:
            logger.error(f"❌ TTS generation failed: {e}")
            return None
    
    def text_to_speech_base64(self, text: str, language: str, slow: bool = False) -> Optional[str]:
        """
        Convert text to speech and return as base64 string
        
        Args:
            text: Text to convert
            language: Language name
            slow: Slow down speech
        
        Returns:
            Base64 encoded audio data
        """
        filepath = self.text_to_speech(text, language, slow)
        
        if not filepath or not os.path.exists(filepath):
            return None
        
        try:
            with open(filepath, 'rb') as audio_file:
                audio_data = audio_file.read()
                base64_audio = base64.b64encode(audio_data).decode('utf-8')
            
            # Cleanup file
            os.remove(filepath)
            
            return base64_audio
        
        except Exception as e:
            logger.error(f"❌ Failed to encode audio to base64: {e}")
            return None
    
    def generate_response_audio(self, response_data: Dict, language: str) -> Dict:
        """
        Generate audio for all text fields in response
        
        Args:
            response_data: Response dictionary with text fields
            language: Target language
        
        Returns:
            Dictionary with audio file paths/base64
        """
        audio_data = {}
        
        try:
            # Generate audio for main response text
            if 'predicted_condition' in response_data:
                text = response_data['predicted_condition']
                audio_data['condition_audio'] = self.text_to_speech(text, language)
            
            if 'doctor_consultation_advice' in response_data:
                text = response_data['doctor_consultation_advice']
                audio_data['advice_audio'] = self.text_to_speech(text, language)
            
            # Combine home care advice into single audio
            if 'home_care_advice' in response_data and response_data['home_care_advice']:
                advice_list = response_data['home_care_advice']
                combined_text = ". ".join(advice_list)
                audio_data['home_care_audio'] = self.text_to_speech(combined_text, language)
            
            logger.info(f"✅ Generated {len(audio_data)} audio files")
        
        except Exception as e:
            logger.error(f"❌ Failed to generate response audio: {e}")
        
        return audio_data
    
    def create_tts_payload(self, response_data: Dict, language: str) -> Dict:
        """
        Create TTS payload for frontend
        
        Args:
            response_data: Response data
            language: Target language
        
        Returns:
            TTS payload with base64 audio
        """
        tts_payload = {
            'language': language,
            'audio_files': {}
        }
        
        try:
            # Generate condition audio
            if 'predicted_condition' in response_data:
                audio = self.text_to_speech_base64(response_data['predicted_condition'], language)
                if audio:
                    tts_payload['audio_files']['condition'] = audio
            
            # Generate advice audio
            if 'doctor_consultation_advice' in response_data:
                audio = self.text_to_speech_base64(response_data['doctor_consultation_advice'], language)
                if audio:
                    tts_payload['audio_files']['advice'] = audio
            
            # Generate home care audio
            if 'home_care_advice' in response_data and response_data['home_care_advice']:
                combined = ". ".join(response_data['home_care_advice'])
                audio = self.text_to_speech_base64(combined, language)
                if audio:
                    tts_payload['audio_files']['home_care'] = audio
            
            logger.info(f"✅ TTS payload created with {len(tts_payload['audio_files'])} audio files")
        
        except Exception as e:
            logger.error(f"❌ Failed to create TTS payload: {e}")
        
        return tts_payload


# Global voice service instance
_voice_service = None

def get_voice_service() -> VoiceService:
    """Get or create voice service instance"""
    global _voice_service
    if _voice_service is None:
        _voice_service = VoiceService()
    return _voice_service


def generate_audio(text: str, language: str) -> str:
    """Convenience function to generate audio"""
    voice = get_voice_service()
    return voice.text_to_speech(text, language)


def generate_tts_payload(response_data: Dict, language: str) -> Dict:
    """Convenience function to create TTS payload"""
    voice = get_voice_service()
    return voice.create_tts_payload(response_data, language)
