import os
import json
import logging
from typing import Dict, Callable, Optional

import requests

from . import prompt_templates, safety_rules, utils
from .models import SymptomRequest, SymptomResponse, MedicineRecommendation

logger = logging.getLogger(__name__)


# Optional translator: try to import IndicTrans2-style package if available
_translator: Optional[Callable[[str, str], str]] = None
try:
    # Attempt common names; if not present, translator remains None
    from indic_trans2 import translate as _indic_translate  # type: ignore

    def _translate(text: str, lang: str) -> str:
        return _indic_translate(text, target_lang=lang)

    _translator = _translate
except Exception:
    try:
        from indictrans import translate as _indic_translate2  # type: ignore

        def _translate2(text: str, lang: str) -> str:
            return _indic_translate2(text, lang)

        _translator = _translate2
    except Exception:
        _translator = None


def call_llm(prompt: str) -> str:
    provider = os.environ.get("LLM_PROVIDER", "ollama").lower().strip()
    logger.info("=" * 70)
    logger.info("LLM PROVIDER: '%s'", provider)
    logger.info("=" * 70)
    
    if provider == "mock":
        logger.warning("!!! WARNING: Using MOCK provider - NOT calling real LLM !!!")
        logger.warning("To use real Neural-Chat-7B, set LLM_PROVIDER=ollama in .env")
        raise ValueError("Mock provider disabled. Set LLM_PROVIDER=ollama in .env to use Neural-Chat-7B")
    
    if provider == "ollama":
        logger.info("*** CALLING NEURAL-CHAT-7B VIA OLLAMA ***")
        ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
        ollama_model = os.environ.get("OLLAMA_MODEL", "neural-chat").strip()
        
        logger.info("Ollama URL: %s", ollama_url)
        logger.info("Ollama Model: %s", ollama_model)
        logger.info("Prompt length: %d characters", len(prompt))
        logger.info("Prompt (first 800 chars):\n%s", prompt[:800])
        
        api_url = f"{ollama_url}/api/generate"
        payload = {
            "model": ollama_model,
            "prompt": prompt,
            "stream": False,
            "temperature": float(os.environ.get("LLM_TEMPERATURE", 0.3)),
        }
        
        try:
            logger.info("Sending request to Ollama...")
            logger.info("WARNING: This may take 30-120 seconds for Mistral to respond...")
            # Increase timeout to 5 minutes (300 seconds) for slow systems
            resp = requests.post(api_url, json=payload, timeout=300)
            
            logger.info("Ollama response status: %d", resp.status_code)
            
            if resp.status_code != 200:
                error_msg = resp.text
                logger.error("Ollama error (status %d): %s", resp.status_code, error_msg)
                raise Exception(f"Ollama error: {resp.status_code} - {error_msg}")
            
            resp.raise_for_status()
            
            # Ollama returns {"response": "...text..."} format
            resp_json = resp.json()
            llm_output = resp_json.get("response", "")
            
            logger.info("Neural-Chat response received (%d chars)", len(llm_output))
            logger.info("Neural-Chat output (first 1500 chars):\n%s", llm_output[:1500])
            
            # Try to extract JSON from the response
            try:
                parsed = utils.try_parse_json(llm_output)
                logger.info("✓ SUCCESS: Parsed JSON from Neural-Chat response")
                logger.info("Predicted condition: '%s'", parsed.get("predicted_condition"))
                logger.info("Number of medicines: %d", len(parsed.get("recommended_medicines", [])))
                return json.dumps(parsed)
            except Exception as parse_err:
                logger.error("✗ FAILED: Cannot parse JSON from Neural-Chat")
                logger.error("Parse error: %s", parse_err)
                logger.error("Full Neural-Chat output:\n%s", llm_output)
                raise ValueError(f"Neural-Chat did not return valid JSON.\n\nNeural-Chat output:\n{llm_output[:2000]}\n\nError: {parse_err}")
                
        except requests.exceptions.ConnectionError as ce:
            logger.error("✗ FATAL: Cannot connect to Ollama")
            logger.error("Ollama URL: %s", ollama_url)
            logger.error("Error: %s", ce)
            raise Exception(
                f"Cannot connect to Ollama at {ollama_url}\n\n"
                f"Solutions:\n"
                f"1. Make sure Ollama is running: ollama serve\n"
                f"2. Verify model is installed: ollama list\n"
                f"3. Check OLLAMA_URL in .env is correct"
            )
        except Exception as e:
            logger.exception("✗ ERROR calling Ollama/Neural-Chat: %s", e)
            raise
    
    else:
        logger.error("Invalid LLM_PROVIDER: %s", provider)
        raise ValueError(f"Invalid LLM_PROVIDER: {provider}. Must be 'ollama'. Set in .env file.")


def _translate_text_if_needed(text: str, lang: str) -> str:
    if not text:
        return text
    if not lang or lang.lower().startswith("en"):
        return text
    if _translator is None:
        logger.info("Translator not available; returning original text")
        return text
    try:
        return _translator(text, lang)
    except Exception:
        logger.exception("Translation failed for text")
        return text


def translate_if_needed(resp: Dict, lang: str) -> Dict:
    if not lang or lang.lower().startswith("en"):
        return resp

    # Translate top-level scalar fields
    if "predicted_condition" in resp:
        resp["predicted_condition"] = _translate_text_if_needed(resp.get("predicted_condition", ""), lang)

    if "doctor_consultation_advice" in resp:
        resp["doctor_consultation_advice"] = _translate_text_if_needed(resp.get("doctor_consultation_advice", ""), lang)

    if "disclaimer" in resp:
        resp["disclaimer"] = _translate_text_if_needed(resp.get("disclaimer", ""), lang)

    # Translate lists
    if "home_care_advice" in resp and isinstance(resp.get("home_care_advice"), list):
        resp["home_care_advice"] = [
            _translate_text_if_needed(x, lang) for x in resp.get("home_care_advice", [])
        ]

    # Translate medicines
    meds = resp.get("recommended_medicines", [])
    translated_meds = []
    for m in meds:
        nm = dict(m)
        if "instructions" in nm:
            nm["instructions"] = _translate_text_if_needed(nm.get("instructions", ""), lang)
        if "warnings" in nm and isinstance(nm.get("warnings"), list):
            nm["warnings"] = [
                _translate_text_if_needed(w, lang) for w in nm.get("warnings", [])
            ]
        translated_meds.append(nm)
    resp["recommended_medicines"] = translated_meds

    return resp


def recommend_symptoms(req: SymptomRequest) -> SymptomResponse:
    logger.info("=== NEW RECOMMENDATION REQUEST ===")
    body = req.dict()
    logger.info("Request body: %s", body)
    prompt = prompt_templates.build_prompt(body)
    logger.info("LLM prompt: %s", prompt)
    raw = call_llm(prompt)
    logger.info("LLM raw output: %s", raw)

    try:
        parsed = utils.try_parse_json(raw)
    except Exception:
        # fallback
        parsed = json.loads(call_llm(""))

    parsed = translate_if_needed(parsed, req.language)

    # Apply safety filters
    parsed = safety_rules.sanitize_response(parsed, req.allergies, req.pregnancy_status, req.existing_conditions)

    # Create TTS payload
    tts = utils.generate_tts_payload(parsed)
    parsed["tts_payload"] = tts

    # Ensure disclaimer exists
    if "disclaimer" not in parsed:
        parsed["disclaimer"] = "This is not a medical diagnosis. Consult a doctor for serious symptoms."

    # Build Pydantic response
    meds = []
    for m in parsed.get("recommended_medicines", []):
        meds.append(MedicineRecommendation(**m))

    resp = SymptomResponse(
        predicted_condition=parsed.get("predicted_condition", "Unknown"),
        recommended_medicines=meds,
        home_care_advice=parsed.get("home_care_advice", []),
        doctor_consultation_advice=parsed.get("doctor_consultation_advice", ""),
        disclaimer=parsed.get("disclaimer", ""),
        tts_payload=parsed.get("tts_payload"),
    )

    return resp
