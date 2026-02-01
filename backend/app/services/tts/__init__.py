"""TTS service package"""
from .voice_service import get_voice_service, generate_audio, generate_tts_payload

__all__ = ['get_voice_service', 'generate_audio', 'generate_tts_payload']
