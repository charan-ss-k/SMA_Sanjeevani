"""
Configuration settings for SMA Sanjeevani
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "SMA Sanjeevani"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-12345678901234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://0.0.0.0:5173",
        "http://0.0.0.0:3000",
        "http://0.0.0.0:8000",
    ]
    
    # LLM Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")  # Alternative naming
    LLM_MODEL: str = os.getenv("LLM_MODEL", "microsoft/phi-4")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "phi4")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "1024"))
    
    # TTS Configuration
    TTS_MODEL: str = os.getenv("TTS_MODEL", "tts_models/en/ljspeech/tacotron2-DDC")
    USE_BHASHINI_TTS: bool = os.getenv("USE_BHASHINI_TTS", "false").lower() == "true"
    USE_GOOGLE_TTS: bool = os.getenv("USE_GOOGLE_TTS", "false").lower() == "true"
    USE_GTTS: bool = os.getenv("USE_GTTS", "true").lower() == "true"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env


settings = Settings()
