"""
Translation Service for Multi-Language Support
Handles translation between user's language and English for processing,
then back to target language for output
"""

import logging
from typing import Optional, Dict
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Load environment variables from .env file if it exists
def _load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
            logger.info(f"✅ Loaded environment variables from {env_path}")
        except ImportError:
            logger.debug("python-dotenv not installed, skipping .env file")
    
    # Set up Google Cloud credentials if not already set
    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        # Try common locations
        possible_paths = [
            Path(__file__).parent.parent.parent.parent / "google-cloud-credentials.json",
            Path.home() / ".sma" / "google-cloud-credentials.json",
            Path("C:\\Users") / os.getenv("USERNAME", "default") / ".sma" / "google-cloud-credentials.json",
        ]
        
        for cred_path in possible_paths:
            if cred_path.exists():
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(cred_path)
                logger.info(f"✅ Found Google Cloud credentials at: {cred_path}")
                break

_load_env()

# Language codes mapping
LANGUAGE_CODES = {
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

LANGUAGE_NAMES = {
    "en": "english",
    "hi": "hindi",
    "te": "telugu",
    "ta": "tamil",
    "mr": "marathi",
    "bn": "bengali",
    "kn": "kannada",
    "ml": "malayalam",
    "gu": "gujarati",
}


class TranslationService:
    """Handle translation between Indic languages and English"""
    
    def __init__(self):
        self.translator = None
        self.google_translator = None
        self._initialize_translators()
    
    def _initialize_translators(self):
        """Initialize translation libraries"""
        try:
            # Try to use indic-trans2 for best quality
            from indic_trans2.client import Client
            self.translator = Client()
            logger.info("✅ Initialized Indic-Trans2 translator")
        except ImportError:
            logger.debug("ℹ️ indic-trans2 not available, using fallback")
            self.translator = None
        
        # Suppress Google API warnings
        import warnings
        warnings.filterwarnings('ignore', category=FutureWarning)
        logging.getLogger('google.api_core._python_version_support').setLevel(logging.ERROR)
        
        try:
            # Fallback to Bhashini or other services (not Google)
            # Google Cloud is deprecated, using Bhashini TTS instead
            logger.debug("ℹ️ Using Bhashini TTS for all speech generation (no Google Cloud)")
            self.google_translator = None
        except Exception as e:
            logger.debug(f"ℹ️ Translation fallback: {e}")
    
    def translate_to_english(self, text: str, source_language: str) -> str:
        """
        Translate user input from source language to English
        """
        if source_language.lower() == "english" or source_language == "en":
            return text
        
        try:
            # Try indic-trans2 first (better for Indic languages)
            if self.translator:
                lang_code = LANGUAGE_CODES.get(source_language.lower(), source_language)
                result = self.translator.translate_paragraph(
                    text,
                    source_language=lang_code,
                    target_language="en",
                    script=self._get_script(lang_code)
                )
                logger.info(f"✅ Translated from {source_language} to English using Indic-Trans2")
                return result
        except Exception as e:
            logger.warning(f"Indic-Trans2 translation failed: {e}")
        
        try:
            # Fallback to Google Translate
            if self.google_translator:
                result = self.google_translator.translate_text(
                    text,
                    source_language=LANGUAGE_CODES.get(source_language.lower()),
                    target_language="en"
                )
                logger.info(f"✅ Translated from {source_language} to English using Google Translate")
                return result['translatedText']
        except Exception as e:
            logger.warning(f"Google translation failed: {e}")
        
        # If all translation fails, return original text
        logger.warning(f"⚠️ Translation failed, using original text")
        return text
    
    def translate_from_english(self, text: str, target_language: str) -> str:
        """
        Translate LLM output from English back to target language
        """
        if target_language.lower() == "english" or target_language == "en":
            return text
        
        try:
            # Try indic-trans2 first
            if self.translator:
                lang_code = LANGUAGE_CODES.get(target_language.lower(), target_language)
                result = self.translator.translate_paragraph(
                    text,
                    source_language="en",
                    target_language=lang_code,
                    script=self._get_script(lang_code)
                )
                logger.info(f"✅ Translated from English to {target_language} using Indic-Trans2")
                return result
        except Exception as e:
            logger.warning(f"Indic-Trans2 translation failed: {e}")
        
        try:
            # Fallback to Google Translate
            if self.google_translator:
                result = self.google_translator.translate_text(
                    text,
                    source_language="en",
                    target_language=LANGUAGE_CODES.get(target_language.lower())
                )
                logger.info(f"✅ Translated from English to {target_language} using Google Translate")
                return result['translatedText']
        except Exception as e:
            logger.warning(f"Google translation failed: {e}")
        
        logger.warning(f"⚠️ Translation failed, using English text")
        return text
    
    @staticmethod
    def _get_script(language_code: str) -> Optional[str]:
        """Get script for Indic language"""
        script_map = {
            "hi": "Devanagari",
            "te": "Telugu",
            "ta": "Tamil",
            "mr": "Devanagari",
            "bn": "Bengali",
            "kn": "Kannada",
            "ml": "Malayalam",
            "gu": "Gujarati",
        }
        return script_map.get(language_code)
    
    def detect_language(self, text: str) -> str:
        """Detect the language of input text"""
        try:
            if self.google_translator:
                result = self.google_translator.detect_language(text)
                detected_lang = result['language']
                return LANGUAGE_NAMES.get(detected_lang, detected_lang)
        except Exception as e:
            logger.warning(f"Language detection failed: {e}")
        
        return "english"  # Default to English if detection fails


# Initialize global translation service
translation_service = TranslationService()


def translate_symptoms_to_english(symptoms: list, source_language: str) -> list:
    """Translate symptom list to English"""
    if source_language.lower() == "english" or source_language == "en":
        return symptoms
    
    english_symptoms = []
    for symptom in symptoms:
        translated = translation_service.translate_to_english(symptom, source_language)
        english_symptoms.append(translated)
        logger.info(f"Symptom translated: '{symptom}' → '{translated}'")
    
    return english_symptoms


def translate_response_to_language(response_text: str, target_language: str) -> str:
    """Translate LLM response to target language"""
    if target_language.lower() == "english" or target_language == "en":
        return response_text
    
    return translation_service.translate_from_english(response_text, target_language)


def translate_json_response(response_dict: dict, target_language: str) -> dict:
    """Translate specific fields in JSON response"""
    if target_language.lower() == "english" or target_language == "en":
        return response_dict
    
    translated_response = response_dict.copy()
    
    # Translate text fields
    text_fields = [
        "predicted_condition",
        "symptom_analysis",
        "doctor_consultation_advice",
        "when_to_see_doctor"
    ]
    
    for field in text_fields:
        if field in translated_response:
            translated_response[field] = translation_service.translate_from_english(
                translated_response[field],
                target_language
            )
    
    # Translate arrays
    if "home_care_advice" in translated_response:
        translated_response["home_care_advice"] = [
            translation_service.translate_from_english(advice, target_language)
            for advice in translated_response["home_care_advice"]
        ]
    
    # Translate medicines details
    if "recommended_medicines" in translated_response:
        for medicine in translated_response["recommended_medicines"]:
            for field in ["instructions", "warnings"]:
                if field in medicine and isinstance(medicine[field], list):
                    medicine[field] = [
                        translation_service.translate_from_english(item, target_language)
                        for item in medicine[field]
                    ]
    
    return translated_response
