"""
Translation Service using Google Translate (no API key needed)
Translates Phi-4 English output to native languages
"""

import logging
from typing import Dict, Optional
from googletrans import Translator

logger = logging.getLogger(__name__)


class MultiLangTranslator:
    """Handles translation from English to Indian regional languages"""
    
    # Language code mapping
    LANG_MAP = {
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
    
    def __init__(self):
        self.translator = Translator()
        logger.info("✅ Translation service initialized (googletrans)")
    
    def translate_text(self, text: str, target_lang: str, source_lang: str = 'en') -> str:
        """
        Translate text from source to target language
        
        Args:
            text: Text to translate
            target_lang: Target language (e.g., 'hindi', 'telugu')
            source_lang: Source language code (default: 'en' for English)
        
        Returns:
            Translated text
        """
        if not text or not text.strip():
            return text
        
        # Convert language name to code
        target_code = self.LANG_MAP.get(target_lang.lower(), target_lang)
        
        # Skip translation if target is English
        if target_code == 'en' or target_lang.lower() == 'english':
            return text
        
        try:
            logger.info(f"🔄 Translating to {target_lang}...")
            result = self.translator.translate(text, src=source_lang, dest=target_code)
            translated = result.text
            logger.info(f"✅ Translation complete")
            return translated
        except Exception as e:
            logger.error(f"❌ Translation failed: {e}")
            logger.warning(f"⚠️ Returning original English text")
            return text
    
    def translate_json_fields(self, data: Dict, target_lang: str) -> Dict:
        """
        Translate all text fields in a JSON response
        
        Args:
            data: Dictionary with response data
            target_lang: Target language
        
        Returns:
            Dictionary with translated fields
        """
        if target_lang.lower() == 'english':
            return data
        
        logger.info(f"🔄 Translating JSON response to {target_lang}...")
        
        try:
            translated_data = {}
            
            for key, value in data.items():
                if isinstance(value, str):
                    # Translate string fields
                    translated_data[key] = self.translate_text(value, target_lang)
                elif isinstance(value, list):
                    # Translate list items
                    translated_list = []
                    for item in value:
                        if isinstance(item, str):
                            translated_list.append(self.translate_text(item, target_lang))
                        elif isinstance(item, dict):
                            # Translate nested dictionaries
                            translated_item = {}
                            for k, v in item.items():
                                if isinstance(v, str):
                                    translated_item[k] = self.translate_text(v, target_lang)
                                else:
                                    translated_item[k] = v
                            translated_list.append(translated_item)
                        else:
                            translated_list.append(item)
                    translated_data[key] = translated_list
                elif isinstance(value, dict):
                    # Recursively translate nested dicts
                    translated_data[key] = self.translate_json_fields(value, target_lang)
                else:
                    # Keep non-string values as is
                    translated_data[key] = value
            
            logger.info(f"✅ JSON translation complete")
            return translated_data
        
        except Exception as e:
            logger.error(f"❌ JSON translation failed: {e}")
            logger.warning(f"⚠️ Returning original data")
            return data


# Global translator instance
_translator = None

def get_translator() -> MultiLangTranslator:
    """Get or create translator instance"""
    global _translator
    if _translator is None:
        _translator = MultiLangTranslator()
    return _translator


def translate_text(text: str, target_lang: str) -> str:
    """Convenience function to translate text"""
    translator = get_translator()
    return translator.translate_text(text, target_lang)


def translate_response(data: Dict, target_lang: str) -> Dict:
    """Convenience function to translate JSON response"""
    translator = get_translator()
    return translator.translate_json_fields(data, target_lang)
