from fastapi import APIRouter, HTTPException, Depends
import logging
import os
import requests
import json
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from .models import SymptomRequest, SymptomResponse
from . import service
from app.core.database import get_db
from app.models.models import MedicineHistory, QAHistory
from app.core.middleware import get_current_user_optional

router = APIRouter()
logger = logging.getLogger(__name__)

# Try enhanced TTS first, fallback to original
try:
    from .. import tts_service_enhanced as tts_service
    logger.info("✅ Using Enhanced TTS Service (Bhashini/gTTS/Google)")
except ImportError:
    logger.warning("⚠️ Enhanced TTS not available, using original TTS service")
    from .. import tts_service


@router.get("/api/symptoms/status")
async def status():
    """Check LLM provider status and configuration"""
    provider = os.environ.get("LLM_PROVIDER", "mock").strip().lower()
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
    ollama_model = os.environ.get("OLLAMA_MODEL", "meditron").strip()
    
    return {
        "status": "ok",
        "llm_provider": provider,
        "ollama_url": ollama_url if provider == "ollama" else "N/A",
        "ollama_model": ollama_model if provider == "ollama" else "N/A",
        "note": "If llm_provider is 'mock', change LLM_PROVIDER=ollama in .env file"
    }


@router.get("/api/symptoms/test-ollama")
async def test_ollama():
    """Simple test to verify Meditron-7B is working"""
    logger.info("=== TESTING OLLAMA DIRECTLY ===")
    
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
    ollama_model = os.environ.get("OLLAMA_MODEL", "meditron").strip()
    
    # Simple test prompt
    test_prompt = "Respond with only valid JSON. A 28-year-old male has headache. What could be the condition? Return: {\"condition\": \"...\", \"medicine\": \"...\"}"
    
    payload = {
        "model": ollama_model,
        "prompt": test_prompt,
        "stream": False,
        "temperature": 0.3,
    }
    
    try:
        logger.info("Sending simple test to Ollama at %s", f"{ollama_url}/api/generate")
        logger.info("Model: %s", ollama_model)
        logger.info("Test prompt: %s", test_prompt)
        
        resp = requests.post(f"{ollama_url}/api/generate", json=payload, timeout=300)
        
        if resp.status_code == 200:
            resp_json = resp.json()
            llm_output = resp_json.get("response", "")
            logger.info("✓ Ollama responded successfully")
            logger.info("Raw output:\n%s", llm_output)
            
            return {
                "status": "success",
                "ollama_running": True,
                "model": ollama_model,
                "raw_response": llm_output,
                "response_length": len(llm_output),
                "note": "If you see output above, Mistral is working. Check if it contains valid JSON."
            }
        else:
            return {
                "status": "error",
                "http_status": resp.status_code,
                "error": resp.text,
                "note": "Ollama returned an error"
            }
    except requests.exceptions.Timeout:
        return {
            "status": "timeout",
            "error": "Ollama/Mistral took too long to respond",
            "note": "Mistral is very slow on your system. This is normal. Increase timeout or use a faster system.",
            "suggestion": "Wait longer or reduce LLM_TEMPERATURE to make it faster"
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "connection_error",
            "error": f"Cannot connect to Ollama at {ollama_url}",
            "note": "Make sure Ollama is running: ollama serve"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "note": "Check backend logs for details"
        }


@router.post("/api/symptoms/recommend", response_model=SymptomResponse)
async def recommend(payload: SymptomRequest, db: Session = Depends(get_db), user_id: Optional[int] = None):
    logger.info("=== ENDPOINT HIT: /api/symptoms/recommend ===")
    logger.info("Incoming payload: %s", payload.dict())
    try:
        resp = service.recommend_symptoms(payload)
        logger.info("Response ready: %s", resp)
        
        # Save to database if user_id is provided
        if user_id:
            try:
                medicine_rec = MedicineHistory(
                    user_id=user_id,
                    symptoms=payload.symptoms,  # Store as JSON
                    predicted_condition=resp.predicted_condition,
                    recommended_medicines=resp.recommended_medicines,
                    home_care_advice=resp.home_care_advice,
                    doctor_consultation_advice=resp.doctor_consultation_advice
                )
                db.add(medicine_rec)
                db.commit()
                logger.info(f"✅ Saved medicine recommendation to database for user {user_id}")
            except Exception as db_error:
                logger.error(f"❌ Failed to save medicine recommendation: {db_error}")
                db.rollback()
                # Don't fail the request, just log the error
        
        return resp
    except NotImplementedError as e:
        logger.exception("LLM provider not configured")
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        logger.exception("Failed to generate recommendation: %s", e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/api/medical-qa")
async def medical_qa(
    data: dict, 
    db: Session = Depends(get_db), 
    user_id: Optional[int] = Depends(get_current_user_optional)
):
    """Answer medical Q&A using LLM with only text replies"""
    logger.info("=== ENDPOINT HIT: /api/medical-qa ===")
    logger.info("Incoming question: %s", data.get("question", ""))
    
    question = data.get("question", "").strip()
    category = data.get("category", "General").strip()
    request_language = data.get("language", "english").strip().lower()
    
    if not question:
        logger.error("No question provided")
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        # Answer in the requested language if supported
        answer = service.answer_medical_question(question, language=request_language)
        logger.info("✅ Medical QA response generated: %d chars", len(answer) if answer else 0)
        
        # Save to database if user_id is provided
        if user_id:
            try:
                qa_record = QAHistory(
                    user_id=user_id,
                    question=question,
                    answer=answer,
                    category=category
                )
                db.add(qa_record)
                db.commit()
                logger.info(f"✅ Saved Q&A to database for user {user_id}")
            except Exception as db_error:
                logger.error(f"❌ Failed to save Q&A: {db_error}")
                db.rollback()
                # Don't fail the request, just log the error
        
        response_data = {"answer": answer}
        logger.info("📤 Sending response: %s", response_data)
        return response_data
    except Exception as e:
        logger.exception("❌ Failed to answer medical question: %s", e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/api/tts")
async def generate_tts(data: dict):
    """Generate speech audio from text using Enhanced TTS (Bhashini/gTTS/Google/Coqui)"""
    logger.info("=== ENDPOINT HIT: /api/tts ===")
    
    text = data.get("text", "").strip()
    language = data.get("language", "english").strip()
    
    if not text:
        logger.warning("❌ TTS request missing text")
        raise HTTPException(status_code=400, detail="Text is required")
    
    if not tts_service.validate_language(language):
        logger.warning(f"❌ Unsupported language: {language}")
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
    
    try:
        logger.info(f"🎤 Generating speech for language: {language}, text length: {len(text)}")
        audio_base64 = tts_service.generate_speech(text, language)
        
        if not audio_base64:
            logger.warning("❌ TTS service returned no audio data")
            # Instead of failing, return empty audio to allow Web Speech fallback on frontend
            logger.info("📢 Frontend will fallback to Web Speech API")
            return {
                "audio": None,
                "language": language,
                "format": "wav",
                "note": "Using Web Speech API fallback"
            }
        
        logger.info(f"✅ TTS generated successfully ({len(audio_base64)} bytes)")
        return {
            "audio": audio_base64,
            "language": language,
            "format": "wav"
        }
    except Exception as e:
        logger.exception(f"❌ TTS Error: {e}")
        logger.warning("📢 TTS failed - frontend will use Web Speech API fallback")
        # Return graceful error allowing frontend fallback
        return {
            "audio": None,
            "language": language,
            "format": "wav",
            "error": str(e),
            "note": "TTS service temporarily unavailable, using Web Speech fallback"
        }


@router.get("/api/tts/languages")
async def get_tts_languages():
    """Get list of supported TTS languages"""
    return tts_service.get_supported_languages()

