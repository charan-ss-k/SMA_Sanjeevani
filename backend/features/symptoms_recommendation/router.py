from fastapi import APIRouter, HTTPException
import logging
import os
import requests
import json

from .models import SymptomRequest, SymptomResponse
from . import service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/api/symptoms/status")
async def status():
    """Check LLM provider status and configuration"""
    provider = os.environ.get("LLM_PROVIDER", "mock").strip().lower()
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
    ollama_model = os.environ.get("OLLAMA_MODEL", "mistral").strip()
    
    return {
        "status": "ok",
        "llm_provider": provider,
        "ollama_url": ollama_url if provider == "ollama" else "N/A",
        "ollama_model": ollama_model if provider == "ollama" else "N/A",
        "note": "If llm_provider is 'mock', change LLM_PROVIDER=ollama in .env file"
    }


@router.get("/api/symptoms/test-ollama")
async def test_ollama():
    """Simple test to verify Mistral-7B is working"""
    logger.info("=== TESTING OLLAMA DIRECTLY ===")
    
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
    ollama_model = os.environ.get("OLLAMA_MODEL", "mistral").strip()
    
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
async def recommend(payload: SymptomRequest):
    logger.info("=== ENDPOINT HIT: /api/symptoms/recommend ===")
    logger.info("Incoming payload: %s", payload.dict())
    try:
        resp = service.recommend_symptoms(payload)
        logger.info("Response ready: %s", resp)
        return resp
    except NotImplementedError as e:
        logger.exception("LLM provider not configured")
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        logger.exception("Failed to generate recommendation: %s", e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
