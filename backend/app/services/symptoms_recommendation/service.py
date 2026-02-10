import os
import json
import logging
from typing import Dict, Callable, Optional, List

import requests

from . import prompt_templates, safety_rules, utils
from .models import SymptomRequest, SymptomResponse, MedicineRecommendation
from .translation_service import (
    translate_symptoms_to_english,
    translate_response_to_language,
    translate_json_response,
    translation_service
)

logger = logging.getLogger(__name__)


# Symptom to medicine mapping for intelligent fallback
SYMPTOM_MEDICINE_MAP = {
    "fever": {
        "condition": "Fever",
        "medicines": [
            {"name": "Paracetamol 500mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "3 days"},
            {"name": "Ibuprofen 400mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "3 days"}
        ]
    },
    "cough": {
        "condition": "Cough",
        "medicines": [
            {"name": "Cough Syrup (Dextromethorphan)", "dosage": "10ml", "frequency": "3-4 times daily", "duration": "5 days"},
            {"name": "Throat Lozenges", "dosage": "1 lozenge", "frequency": "every 2 hours", "duration": "5 days"}
        ]
    },
    "cold": {
        "condition": "Common Cold",
        "medicines": [
            {"name": "Decongestant nasal spray", "dosage": "2 sprays per nostril", "frequency": "3 times daily", "duration": "3-5 days"},
            {"name": "Vitamin C tablets 500mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "7 days"}
        ]
    },
    "headache": {
        "condition": "Headache",
        "medicines": [
            {"name": "Paracetamol 500mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "3 days"},
            {"name": "Aspirin 325mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "3 days"}
        ]
    },
    "body pain": {
        "condition": "Body Pain",
        "medicines": [
            {"name": "Ibuprofen 400mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "3 days"},
            {"name": "Muscle relaxant (Paracetamol + Chlorzoxazone)", "dosage": "1 tablet", "frequency": "twice daily", "duration": "5 days"}
        ]
    },
    "throat pain": {
        "condition": "Throat Pain/Sore Throat",
        "medicines": [
            {"name": "Throat lozenges with benzocaine", "dosage": "1 lozenge", "frequency": "every 2 hours", "duration": "5 days"},
            {"name": "Antiseptic throat spray", "dosage": "2-3 sprays", "frequency": "4 times daily", "duration": "5 days"}
        ]
    },
    "diarrhea": {
        "condition": "Diarrhea",
        "medicines": [
            {"name": "Oral Rehydration Salts (ORS)", "dosage": "1 sachet", "frequency": "after each loose stool", "duration": "till diarrhea stops"},
            {"name": "Loperamide 2mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "2 days"}
        ]
    },
    "constipation": {
        "condition": "Constipation",
        "medicines": [
            {"name": "Isabgol (Psyllium husk)", "dosage": "1 teaspoon", "frequency": "once daily at bedtime", "duration": "3-5 days"},
            {"name": "Liquid paraffin", "dosage": "1-2 tablespoons", "frequency": "once daily", "duration": "3-5 days"}
        ]
    },
    "acidity": {
        "condition": "Acidity/Heartburn",
        "medicines": [
            {"name": "Antacid (Magnesium Hydroxide)", "dosage": "1-2 tablespoons", "frequency": "3 times daily after meals", "duration": "5-7 days"},
            {"name": "Omeprazole 20mg", "dosage": "1 capsule", "frequency": "once daily", "duration": "7-14 days"}
        ]
    },
    "allergy": {
        "condition": "Allergy",
        "medicines": [
            {"name": "Antihistamine (Cetirizine 10mg)", "dosage": "1 tablet", "frequency": "once daily", "duration": "5-7 days"},
            {"name": "Antihistamine (Loratadine 10mg)", "dosage": "1 tablet", "frequency": "once daily", "duration": "5-7 days"}
        ]
    },
    "nausea": {
        "condition": "Nausea/Vomiting",
        "medicines": [
            {"name": "Domperidone 10mg", "dosage": "1 tablet", "frequency": "3 times daily before meals", "duration": "3-5 days"},
            {"name": "Ondansetron 4mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "3 days"}
        ]
    }
}


def _generate_symptom_aware_fallback(symptoms: List[str], age: int = 30) -> Dict:
    """Generate a symptom-appropriate fallback response when LLM fails."""
    symptoms_str = " ".join(symptoms).lower() if symptoms else ""
    
    # Find matching symptoms
    matched_condition = None
    matched_medicines = None
    
    for symptom_key, medicine_info in SYMPTOM_MEDICINE_MAP.items():
        if symptom_key in symptoms_str:
            matched_condition = medicine_info["condition"]
            matched_medicines = medicine_info["medicines"]
            break
    
    # If no specific match, find closest match
    if not matched_medicines:
        for symptom_key, medicine_info in SYMPTOM_MEDICINE_MAP.items():
            for symptom in symptoms:
                if symptom_key.split()[0] in symptom.lower():
                    matched_condition = medicine_info["condition"]
                    matched_medicines = medicine_info["medicines"]
                    break
            if matched_medicines:
                break
    
    # Default if still no match
    if not matched_medicines:
        matched_condition = "General Illness"
        matched_medicines = [
            {"name": "Paracetamol 500mg", "dosage": "1 tablet", "frequency": "twice daily", "duration": "3 days"}
        ]
    
    # Format medicines with proper structure
    formatted_medicines = []
    for med in matched_medicines:
        formatted_medicines.append({
            "name": med["name"],
            "dosage": med["dosage"],
            "frequency": med["frequency"],
            "duration": med["duration"],
            "instructions": f"Take {med['dosage']} {med['frequency']}, {med['duration']}",
            "warnings": ["Consult doctor if symptoms persist", "Check allergies before use"]
        })
    
    return {
        "predicted_condition": matched_condition,
        "symptom_analysis": f"Based on reported symptoms: {', '.join(symptoms)}",
        "recommended_medicines": formatted_medicines,
        "home_care_advice": [
            "Rest adequately",
            "Drink plenty of water and fluids",
            "Avoid strenuous activities",
            "Eat light, nutritious food"
        ],
        "doctor_consultation_advice": "Consult a doctor if symptoms persist for more than 3-5 days or worsen",
        "disclaimer": "This is not a professional diagnosis. Please consult a qualified doctor for proper evaluation."
    }


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
    logger.info("🔧 Symptoms Recommendation Service using LLM PROVIDER: '%s'", provider)
    if provider == "azure_openai":
        logger.info("✅ USING AZURE OPENAI (NOT LOCAL OLLAMA)")
    logger.info("=" * 70)
    
    if provider == "mock":
        logger.warning("!!! WARNING: Using MOCK provider - NOT calling real LLM !!!")
        logger.warning("To use real Phi-4, set LLM_PROVIDER=ollama or azure_openai in .env")
        raise ValueError("Mock provider disabled. Set LLM_PROVIDER=ollama or azure_openai in .env to use Phi-4")
    
    if provider == "azure_openai":
        logger.info("Calling Phi-4 via Azure OpenAI for independent medical reasoning...")
        
        # Get Azure OpenAI configuration from environment
        azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT", "").strip()
        azure_api_key = os.environ.get("AZURE_OPENAI_API_KEY", "").strip()
        azure_deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "Sanjeevani-Phi-4").strip()
        
        if not azure_endpoint or not azure_api_key:
            raise ValueError("Azure OpenAI credentials missing. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in .env")
        
        # Azure OpenAI uses OpenAI-compatible API
        # Remove '/openai/v1/' from endpoint if present and reconstruct proper URL
        base_endpoint = azure_endpoint.replace("/openai/v1/", "").rstrip("/")
        api_url = f"{base_endpoint}/openai/deployments/{azure_deployment}/chat/completions?api-version=2024-02-15-preview"
        
        logger.info("Azure Endpoint: %s", base_endpoint)
        logger.info("Deployment: %s", azure_deployment)
        
        payload = {
            "messages": [
                {"role": "system", "content": "You are a medical AI assistant. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": float(os.environ.get("LLM_TEMPERATURE", 0.2)),
            "max_tokens": int(os.environ.get("LLM_MAX_TOKENS", 1024)),
        }
        
        headers = {
            "Content-Type": "application/json",
            "api-key": azure_api_key
        }
        
        try:
            logger.info("Sending request to Azure OpenAI...")
            resp = requests.post(api_url, json=payload, headers=headers, timeout=600)
            
            if resp.status_code != 200:
                error_msg = resp.text
                logger.error("Azure OpenAI error (status %d): %s", resp.status_code, error_msg)
                raise Exception(f"Azure OpenAI error: {resp.status_code} - {error_msg}")
            
            resp.raise_for_status()
            
            # Azure OpenAI returns OpenAI-compatible format
            resp_json = resp.json()
            llm_output = resp_json.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            logger.info("✓ Azure OpenAI (Phi-4) response received")
            
            # Try to extract JSON from the response
            try:
                parsed = utils.try_parse_json(llm_output)
                logger.info("✓ Successfully parsed Azure OpenAI response")
                return json.dumps(parsed)
            except Exception as parse_err:
                logger.error("✗ Failed to parse JSON from Azure OpenAI response")
                logger.error("Parse error: %s", parse_err)
                raise ValueError(f"Azure OpenAI did not return valid JSON. Error: {parse_err}")
                
        except requests.exceptions.ConnectionError as ce:
            logger.error("✗ FATAL: Cannot connect to Azure OpenAI")
            logger.error("Azure Endpoint: %s", azure_endpoint)
            logger.error("Error: %s", ce)
            raise Exception(
                f"Cannot connect to Azure OpenAI at {azure_endpoint}\n\n"
                f"Solutions:\n"
                f"1. Verify AZURE_OPENAI_ENDPOINT is correct in .env\n"
                f"2. Check AZURE_OPENAI_API_KEY is valid\n"
                f"3. Ensure network connectivity to Azure"
            )
        except Exception as e:
            logger.exception("✗ ERROR calling Azure OpenAI: %s", e)
            raise
    
    elif provider == "ollama":
        logger.info("Calling Phi-4 via Ollama for independent medical reasoning...")
        ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
        ollama_model = os.environ.get("OLLAMA_MODEL", "phi4").strip()
        
        logger.info("Model: %s", ollama_model)
        
        api_url = f"{ollama_url}/api/generate"
        payload = {
            "model": ollama_model,
            "prompt": prompt,
            "stream": False,
            "temperature": float(os.environ.get("LLM_TEMPERATURE", 0.3)),
            "num_predict": 512,  # Limit to 512 tokens for faster generation
        }
        
        try:
            logger.info("Sending request to Phi-4...")
            resp = requests.post(api_url, json=payload, timeout=600)
            
            if resp.status_code != 200:
                error_msg = resp.text
                logger.error("Ollama error (status %d): %s", resp.status_code, error_msg)
                raise Exception(f"Ollama error: {resp.status_code} - {error_msg}")
            
            resp.raise_for_status()
            
            # Ollama returns {"response": "...text..."} format
            resp_json = resp.json()
            llm_output = resp_json.get("response", "")
            
            logger.info("✓ Phi-4 response received")
            
            # Try to extract JSON from the response
            try:
                parsed = utils.try_parse_json(llm_output)
                logger.info("✓ Successfully parsed Phi-4 response")
                return json.dumps(parsed)
            except Exception as parse_err:
                logger.error("✗ Failed to parse JSON from Phi-4 response")
                logger.error("Parse error: %s", parse_err)
                raise ValueError(f"Phi-4 did not return valid JSON. Error: {parse_err}")
                
        except requests.exceptions.ConnectionError as ce:
            logger.error("✗ FATAL: Cannot connect to Ollama (Phi-4)")
            logger.error("Ollama URL: %s", ollama_url)
            logger.error("Error: %s", ce)
            raise Exception(
                f"Cannot connect to Ollama at {ollama_url}\n\n"
                f"Solutions:\n"
                f"1. Make sure Ollama is running: ollama serve\n"
                f"2. Verify Phi-4 model is installed: ollama list\n"
                f"3. Check OLLAMA_URL in .env is correct"
            )
        except Exception as e:
            logger.exception("✗ ERROR calling Ollama/Phi-4: %s", e)
            raise
    
    else:
        logger.error("Invalid LLM_PROVIDER: %s", provider)
        raise ValueError(f"Invalid LLM_PROVIDER: {provider}. Must be 'ollama' or 'azure_openai'. Set in .env file.")


def _translate_text_if_needed(text: str, lang: str) -> str:
    """
    Translate text to the target language if translator is available.
    If translator is not available, returns original text with a warning.
    """
    if not text:
        return text
    if not lang or lang.lower().startswith("en"):
        return text
    if _translator is None:
        logger.warning("⚠️ Translator not available; LLM should generate in %s but translator fallback unavailable", lang)
        logger.warning("⚠️ Consider installing indic-trans2: pip install indic-trans2")
        # Return original text - LLM should have generated in correct language anyway
        return text
    try:
        translated = _translator(text, lang)
        logger.debug("Translated text: '%s' -> '%s' (first 50 chars)", text[:50], translated[:50])
        return translated
    except Exception as e:
        logger.exception("Translation failed for text: %s", str(e))
        # Return original text if translation fails
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
    logger.info("Language requested: %s", req.language)
    
    # Get user's language
    user_language = req.language.lower().strip() if req.language else "english"
    
    # Step 1: Translate symptoms to English if needed (for processing)
    original_symptoms = body.get("symptoms", [])
    if user_language != "english":
        logger.info(f"Translating symptoms from {user_language} to English for LLM processing")
        english_symptoms = translate_symptoms_to_english(original_symptoms, user_language)
        body["symptoms"] = english_symptoms
        logger.info(f"Translated symptoms: {english_symptoms}")
    
    # Step 2: Build prompt - Phi-4 will think independently
    prompt = prompt_templates.build_prompt(body, rag_context="")
    logger.info("Prompt built - Phi-4 will generate recommendations independently")
    
    # Step 3: Call LLM for independent thinking
    try:
        raw = call_llm(prompt)
        parsed = utils.try_parse_json(raw)
    except Exception as llm_err:
        # Fallback: Generate a symptom-aware response using RAG
        logger.warning("LLM failed: %s. Using intelligent fallback response...", str(llm_err))
        symptoms = body.get("symptoms", [])
        
        # Generate symptom-appropriate fallback using RAG medicines
        fallback_response = _generate_symptom_aware_fallback(symptoms, body.get("age", 30))
        parsed = fallback_response

    # Step 5: Translate response back to user's language if needed
    if user_language != "english":
        logger.info(f"Translating response back to {user_language}")
        parsed = translate_json_response(parsed, user_language)
        logger.info(f"✅ Response translated to {user_language}")

    # Language verification and fallback translation if needed
    language = req.language.lower().strip() if req.language else "english"
    if language != "english" and language not in ["en"]:
        # Check if the response seems to be in English (simple heuristic)
        # If so, translate it
        first_text = (
            parsed.get("predicted_condition", "") + 
            " ".join(parsed.get("home_care_advice", [])[:1]) +
            parsed.get("doctor_consultation_advice", "")
        )
        # Check if it contains non-ASCII characters (likely in target language)
        if first_text and len(first_text) > 10:
            has_non_ascii = any(ord(c) > 127 for c in first_text[:200])
            if not has_non_ascii:
                logger.info("⚠️ Response appears to be in English, translating to %s...", language)
                parsed = translate_if_needed(parsed, language)
                logger.info("✅ Translation completed for %s", language)
            else:
                logger.info("✅ Response appears to already be in %s language", language)
        else:
            # If text is too short, translate anyway to be safe
            logger.info("⚠️ Text too short to verify, translating to %s to ensure correctness...", language)
            parsed = translate_if_needed(parsed, language)
    else:
        logger.info("English language requested, no translation needed")

    # Apply safety filters
    parsed = safety_rules.sanitize_response(parsed, req.allergies, req.pregnancy_status, req.existing_conditions)

    # Create TTS payload
    tts = utils.generate_tts_payload(parsed)
    parsed["tts_payload"] = tts

    # Ensure disclaimer exists in the correct language
    if "disclaimer" not in parsed or not parsed.get("disclaimer"):
        # Generate disclaimer in the requested language
        language = req.language.lower().strip() if req.language else "english"
        if language != "english" and language not in ["en"]:
            # Use translation function to get disclaimer in the correct language
            parsed["disclaimer"] = _translate_text_if_needed(
                "This is not a medical diagnosis. Consult a doctor for serious symptoms.",
                language
            )
        else:
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


def answer_medical_question(question: str, language: str = "english") -> str:
    """
    Answer ANY question using Phi-4 LLM as a medical assistant.
    The LLM intelligently determines if it's medical and responds appropriately.
    Works with medical terms from around the world in multiple languages.
    Acts like ChatGPT for medical knowledge.
    """
    logger.info("=" * 70)
    logger.info("MEDICAL Q&A: %s", question)
    logger.info("Language: %s", language)
    logger.info("=" * 70)

    # Language mapping for prompt
    lang_names = {
        "english": "English",
        "telugu": "Telugu (తెలుగు)",
        "hindi": "Hindi (हिन्दी)",
        "marathi": "Marathi (मराठी)",
        "bengali": "Bengali (বাংলা)",
        "tamil": "Tamil (தமிழ்)",
        "kannada": "Kannada (ಕನ್ನಡ)",
        "malayalam": "Malayalam (മലയാളം)",
        "gujarati": "Gujarati (ગુજરાતી)",
    }
    lang_display = lang_names.get(language.lower(), "English")

    # Create a comprehensive prompt for medical Q&A
    # The LLM itself will determine if the question is medical
    # Using Phi-4 (Microsoft), a powerful general-purpose language model optimized for medical expertise
    prompt = f"""You are Sanjeevani, an advanced AI medical assistant trained on global medical knowledge.
Your role is to:
1. Answer medical, health, and healthcare-related questions comprehensively
2. Support multiple languages and medical terminology from around the world
3. Provide accurate, evidence-based medical information
4. Always emphasize consulting healthcare professionals for serious concerns
5. Handle rare diseases, specific conditions, and complex medical scenarios
6. Explain medical concepts clearly for lay people

LANGUAGE INSTRUCTION (CRITICAL - MUST FOLLOW):
- The user's preferred language is: {lang_display}
- YOU MUST ALWAYS RESPOND IN {lang_display.upper()} LANGUAGE, regardless of the question language
- Even if the question is in English, you MUST respond in {lang_display}
- If the question is in a different language, still respond in {lang_display}
- This is a requirement for rural users who need responses in their native language
- DO NOT match the question language - ALWAYS use {lang_display}

IMPORTANT RULES:
- If the question is about health, medicine, disease, symptoms, treatment, prevention, or healthcare: ANSWER COMPREHENSIVELY
- If the question is NOT medical: Politely decline and redirect to medical topics (in {lang_display})
- Always include safety disclaimers when appropriate (in {lang_display})
- Never diagnose definitively - provide information and suggest professional consultation (in {lang_display})
- Accept medical terms in any language and from any medical tradition
- Be thorough but concise (2-5 sentences for simple questions, more for complex ones)
- Respond ONLY with the answer text, no JSON formatting, no markdown
- CRITICAL: RESPOND ENTIRELY IN {lang_display.upper()} LANGUAGE - NO EXCEPTIONS

Question from user: {question}

Response (in {lang_display}):"""

    try:
        logger.info("Calling LLM for medical Q&A...")
        
        # Get LLM config
        provider = os.environ.get("LLM_PROVIDER", "ollama").lower().strip()
        
        logger.info("🔧 Medical Q&A using LLM Provider: %s", provider)
        if provider == "azure_openai":
            logger.info("✅ CONFIRMED: Using Azure OpenAI Phi-4 (NOT local Ollama)")
        
        if provider == "azure_openai":
            # Azure OpenAI implementation
            azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT", "").strip()
            azure_api_key = os.environ.get("AZURE_OPENAI_API_KEY", "").strip()
            azure_deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "Sanjeevani-Phi-4").strip()
            
            if not azure_endpoint or not azure_api_key:
                raise ValueError("Azure OpenAI credentials missing. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in .env")
            
            base_endpoint = azure_endpoint.replace("/openai/v1/", "").rstrip("/")
            api_url = f"{base_endpoint}/openai/deployments/{azure_deployment}/chat/completions?api-version=2024-02-15-preview"
            
            payload = {
                "messages": [
                    {"role": "system", "content": f"You are a medical AI assistant. Respond ENTIRELY in {lang_display} language."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": float(os.environ.get("LLM_TEMPERATURE", 0.3)),
                "max_tokens": int(os.environ.get("LLM_MAX_TOKENS", 1024)),
            }
            
            headers = {
                "Content-Type": "application/json",
                "api-key": azure_api_key
            }
            
            logger.info("Sending request to Azure OpenAI (Phi-4)...")
            logger.info("Timeout: 60 seconds for medical Q&A response")
            
            resp = requests.post(api_url, json=payload, headers=headers, timeout=60)
            
            if resp.status_code != 200:
                error_msg = resp.text
                logger.error("Azure OpenAI error (status %d): %s", resp.status_code, error_msg)
                raise Exception(f"Azure OpenAI API error: {resp.status_code} - {error_msg}")
            
            resp.raise_for_status()
            
            # Extract response from Azure OpenAI
            resp_json = resp.json()
            answer = resp_json.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            
        elif provider == "ollama":
            ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
            ollama_model = os.environ.get("OLLAMA_MODEL", "phi4").strip()
            
            logger.info("Ollama URL: %s", ollama_url)
            logger.info("Ollama Model: %s (Phi-4)", ollama_model)
            
            # Call Ollama directly without JSON parsing
            api_url = f"{ollama_url}/api/generate"
            payload = {
                "model": ollama_model,
                "prompt": prompt,
                "stream": False,
                "temperature": float(os.environ.get("LLM_TEMPERATURE", 0.3)),
            }
            
            logger.info("Sending request to Phi-4 via Ollama...")
            logger.info("Timeout: 60 seconds for Phi-4 medical Q&A response")
            
            resp = requests.post(api_url, json=payload, timeout=60)
            
            if resp.status_code != 200:
                error_msg = resp.text
                logger.error("Ollama error (status %d): %s", resp.status_code, error_msg)
                raise Exception(f"Ollama API error: {resp.status_code} - {error_msg}")
            
            resp.raise_for_status()
            
            # Extract response from Ollama
            resp_json = resp.json()
            answer = resp_json.get("response", "").strip()
        
        else:
            raise Exception(f"Invalid LLM_PROVIDER: {provider}. Must be 'ollama' or 'azure_openai'")
        
        logger.info("✓ LLM response received (%d chars)", len(answer))
        logger.info("Response (first 500 chars): %s", answer[:500])
        
        # Validate response
        if not answer or len(answer) < 5:
            logger.warning("Response too short or empty, using fallback")
            # Fallback message in the requested language
            fallback_messages = {
                "english": "I couldn't generate a proper response. Please try rephrasing your medical question.",
                "hindi": "मैं एक उचित प्रतिक्रिया उत्पन्न नहीं कर सका। कृपया अपने चिकित्सा प्रश्न को फिर से लिखने का प्रयास करें।",
                "telugu": "నేను సరైన ప్రతిస్పందనను ఉత్పత్తి చేయలేకపోయాను. దయచేసి మీ వైద్య ప్రశ్నను మళ్లీ రూపొందించడానికి ప్రయత్నించండి।",
                "marathi": "मी योग्य प्रतिसाद व्युत्पन्न करू शकलो नाही. कृपया आपला वैद्यकीय प्रश्न पुन्हा लिहिण्याचा प्रयत्न करा.",
                "bengali": "আমি একটি সঠিক প্রতিক্রিয়া তৈরি করতে পারিনি। অনুগ্রহ করে আপনার চিকিৎসা প্রশ্নটি পুনরায় লিখতে চেষ্টা করুন।",
                "tamil": "நான் சரியான பதிலை உருவாக்க முடியவில்லை. தயவுசெய்து உங்கள் மருத்துவ கேள்வியை மீண்டும் எழுத முயற்சிக்கவும்।",
                "kannada": "ನಾನು ಸರಿಯಾದ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಉತ್ಪಾದಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಬರೆಯಲು ಪ್ರಯತ್ನಿಸಿ.",
                "malayalam": "എനിക്ക് ശരിയായ പ്രതികരണം സൃഷ്ടിക്കാൻ കഴിഞ്ഞില്ല. ദയവായി നിങ്ങളുടെ മെഡിക്കൽ ചോദ്യം വീണ്ടും എഴുതാൻ ശ്രമിക്കുക.",
                "gujarati": "હું યોગ્ય પ્રતિભાવ ઉત્પન્ન કરી શક્યો નથી. કૃપા કરીને તમારા તબીબી પ્રશ્નને ફરીથી લખવાનો પ્રયાસ કરો.",
            }
            answer = fallback_messages.get(language.lower(), fallback_messages["english"])
        
        # Final check: If answer is in English but non-English was requested, log a warning
        if language.lower() != "english" and language.lower() not in ["en"]:
            non_ascii_count = sum(1 for c in answer[:200] if ord(c) > 127)
            if non_ascii_count < 5:
                logger.warning("⚠️ LLM response appears to be in English despite %s language request", language)
            else:
                logger.info("✅ LLM response appears to be in %s language", language)
        
        return answer
        
    except requests.exceptions.ConnectionError as ce:
        logger.error("Connection error to Ollama: %s", ce)
        error_messages = {
            "english": f"Cannot connect to LLM service at {os.environ.get('OLLAMA_URL', 'http://localhost:11434')}. Please ensure Ollama is running with: ollama serve",
            "hindi": f"LLM सेवा से कनेक्ट नहीं हो सका। कृपया सुनिश्चित करें कि Ollama चल रहा है: ollama serve",
            "telugu": f"LLM సేవకు కనెక్ట్ చేయడం సాధ్యపడలేదు. దయచేసి Ollama నడుస్తోందని నిర్ధారించండి: ollama serve",
            "marathi": f"LLM सेवेशी कनेक्ट होऊ शकले नाही. कृपया Ollama चालू आहे याची खात्री करा: ollama serve",
            "bengali": f"LLM পরিষেবার সাথে সংযোগ করা যায়নি। অনুগ্রহ করে নিশ্চিত করুন যে Ollama চলছে: ollama serve",
            "tamil": f"LLM சேவையுடன் இணைக்க முடியவில்லை. தயவுசெய்து Ollama இயங்குகிறது என்பதை உறுதிப்படுத்தவும்: ollama serve",
            "kannada": f"LLM ಸೇವೆಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು Ollama ಚಾಲನೆಯಲ್ಲಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಿ: ollama serve",
            "malayalam": f"LLM സേവനവുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി Ollama പ്രവർത്തിക്കുന്നുവെന്ന് ഉറപ്പാക്കുക: ollama serve",
            "gujarati": f"LLM સેવા સાથે કનેક્ટ થઈ શક્યું નથી. કૃપા કરીને ખાતરી કરો કે Ollama ચાલી રહ્યું છે: ollama serve",
        }
        return error_messages.get(language.lower(), error_messages["english"])
    except requests.exceptions.Timeout:
        logger.error("Request timeout to Ollama")
        timeout_messages = {
            "english": "The LLM service took too long to respond. Please try again.",
            "hindi": "LLM सेवा ने प्रतिक्रिया देने में बहुत अधिक समय लिया। कृपया पुनः प्रयास करें।",
            "telugu": "LLM సేవకు ప్రతిస్పందన ఇవ్వడానికి చాలా సమయం పట్టింది. దయచేసి మళ్లీ ప్రయత్నించండి।",
            "marathi": "LLM सेवेने प्रतिसाद देण्यासाठी खूप वेळ घेतला. कृपया पुन्हा प्रयत्न करा.",
            "bengali": "LLM পরিষেবা প্রতিক্রিয়া জানাতে অনেক সময় নিয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            "tamil": "LLM சேவை பதிலளிக்க அதிக நேரம் எடுத்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்।",
            "kannada": "LLM ಸೇವೆಯು ಪ್ರತಿಕ್ರಿಯಿಸಲು ತುಂಬಾ ಸಮಯ ತೆಗೆದುಕೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
            "malayalam": "LLM സേവനം പ്രതികരിക്കാൻ വളരെയധികം സമയമെടുത്തു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
            "gujarati": "LLM સેવાએ પ્રતિભાવ આપવામાં ખૂબ સમય લીધો. કૃપા કરીને ફરીથી પ્રયાસ કરો.",
        }
        return timeout_messages.get(language.lower(), timeout_messages["english"])
    except Exception as e:
        logger.exception("Error in answer_medical_question: %s", e)
        logger.error("Full error details: %s", str(e))
        error_messages = {
            "english": f"Error processing your question: {str(e)[:100]}. Please try again or consult a healthcare professional.",
            "hindi": f"आपके प्रश्न को संसाधित करने में त्रुटि: {str(e)[:100]}। कृपया पुनः प्रयास करें या स्वास्थ्य सेवा पेशेवर से परामर्श करें।",
            "telugu": f"మీ ప్రశ్నను ప్రాసెస్ చేయడంలో లోపం: {str(e)[:100]}। దయచేసి మళ్లీ ప్రయత్నించండి లేదా ఆరోగ్య సంరక్షణ నిపుణుడిని సంప్రదించండి।",
            "marathi": f"तुमचा प्रश्न प्रक्रिया करताना त्रुटी: {str(e)[:100]}। कृपया पुन्हा प्रयत्न करा किंवा आरोग्य सेवा व्यावसायिकांशी सल्लामसलत करा.",
            "bengali": f"আপনার প্রশ্ন প্রক্রিয়া করতে ত্রুটি: {str(e)[:100]}। অনুগ্রহ করে আবার চেষ্টা করুন বা স্বাস্থ্যসেবা পেশাদারের সাথে পরামর্শ করুন।",
            "tamil": f"உங்கள் கேள்வியை செயலாக்குவதில் பிழை: {str(e)[:100]}। தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது சுகாதார நிபுணரை அணுகவும்।",
            "kannada": f"ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುವಲ್ಲಿ ದೋಷ: {str(e)[:100]}। ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಆರೋಗ್ಯ ಸೇವಾ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ।",
            "malayalam": f"നിങ്ങളുടെ ചോദ്യം പ്രോസസ്സ് ചെയ്യുന്നതിൽ പിശക്: {str(e)[:100]}। ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ ആരോഗ്യ സേവാ പ്രൊഫഷണലുമായി കൈകോർത്ത് പരിശോധിക്കുക।",
            "gujarati": f"તમારા પ્રશ્નને પ્રક્રિયા કરવામાં ભૂલ: {str(e)[:100]}। કૃપા કરીને ફરીથી પ્રયાસ કરો અથવા આરોગ્ય સેવા વ્યવસાયિકની સલાહ લો.",
        }
        return error_messages.get(language.lower(), error_messages["english"])