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
        logger.warning("To use real Phi-3.5, set LLM_PROVIDER=ollama in .env")
        raise ValueError("Mock provider disabled. Set LLM_PROVIDER=ollama in .env to use Phi-3.5")
    
    if provider == "ollama":
        logger.info("*** CALLING PHI-3.5 VIA OLLAMA ***")
        ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
        ollama_model = os.environ.get("OLLAMA_MODEL", "phi3.5").strip()
        
        logger.info("Ollama URL: %s", ollama_url)
        logger.info("Ollama Model: %s (Phi-3.5 - fastest medical LLM)", ollama_model)
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
            logger.info("WARNING: This may take 2-5 seconds for Phi-3.5 to respond...")
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
            
            logger.info("Phi-3.5 response received (%d chars)", len(llm_output))
            logger.info("Phi-3.5 output (first 1500 chars):\n%s", llm_output[:1500])
            
            # Try to extract JSON from the response
            try:
                parsed = utils.try_parse_json(llm_output)
                logger.info("✓ SUCCESS: Parsed JSON from Phi-3.5 response")
                logger.info("Predicted condition: '%s'", parsed.get("predicted_condition"))
                logger.info("Number of medicines: %d", len(parsed.get("recommended_medicines", [])))
                return json.dumps(parsed)
            except Exception as parse_err:
                logger.error("✗ FAILED: Cannot parse JSON from Phi-3.5")
                logger.error("Parse error: %s", parse_err)
                logger.error("Full Phi-3.5 output:\n%s", llm_output)
                raise ValueError(f"Phi-3.5 did not return valid JSON.\n\nPhi-3.5 output:\n{llm_output[:2000]}\n\nError: {parse_err}")
                
        except requests.exceptions.ConnectionError as ce:
            logger.error("✗ FATAL: Cannot connect to Ollama (Phi-3.5)")
            logger.error("Ollama URL: %s", ollama_url)
            logger.error("Error: %s", ce)
            raise Exception(
                f"Cannot connect to Ollama at {ollama_url}\n\n"
                f"Solutions:\n"
                f"1. Make sure Ollama is running: ollama serve\n"
                f"2. Verify Phi-3.5 model is installed: ollama list\n"
                f"3. Check OLLAMA_URL in .env is correct"
            )
        except Exception as e:
            logger.exception("✗ ERROR calling Ollama/Phi-3.5: %s", e)
            raise
    
    else:
        logger.error("Invalid LLM_PROVIDER: %s", provider)
        raise ValueError(f"Invalid LLM_PROVIDER: {provider}. Must be 'ollama'. Set in .env file.")


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

    # Build prompt with language instructions
    prompt = prompt_templates.build_prompt(body)
    logger.info("LLM prompt (first 1000 chars): %s", prompt[:1000])
    
    # Call LLM - it should generate in the requested language
    raw = call_llm(prompt)
    logger.info("LLM raw output (first 500 chars): %s", raw[:500])

    try:
        parsed = utils.try_parse_json(raw)
    except Exception:
        # fallback - try again with simpler prompt
        logger.warning("Failed to parse JSON, trying fallback...")
        parsed = json.loads(call_llm(""))

    # Always ensure response is in the requested language
    # Translate if LLM didn't generate in the correct language
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
    Answer ANY question using Phi-3.5 LLM as a medical assistant.
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
        logger.info("Calling Phi-3.5 LLM for medical Q&A...")
        
        # Get LLM config
        provider = os.environ.get("LLM_PROVIDER", "ollama").lower().strip()
        ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").strip()
        ollama_model = os.environ.get("OLLAMA_MODEL", "phi3.5").strip()
        
        logger.info("LLM Provider: %s", provider)
        logger.info("Ollama URL: %s", ollama_url)
        logger.info("Ollama Model: %s (using Phi-3.5 for fast responses)", ollama_model)
        
        if provider != "ollama":
            raise Exception(f"Only Ollama provider is supported. Got: {provider}")
        
        # Call Ollama directly without JSON parsing
        api_url = f"{ollama_url}/api/generate"
        payload = {
            "model": ollama_model,
            "prompt": prompt,
            "stream": False,
            "temperature": float(os.environ.get("LLM_TEMPERATURE", 0.3)),
        }
        
        logger.info("Sending request to Phi-3.5 via Ollama...")
        logger.info("Timeout: 300 seconds")
        
        resp = requests.post(api_url, json=payload, timeout=300)
        
        if resp.status_code != 200:
            error_msg = resp.text
            logger.error("Ollama error (status %d): %s", resp.status_code, error_msg)
            raise Exception(f"Ollama API error: {resp.status_code} - {error_msg}")
        
        resp.raise_for_status()
        
        # Extract response from Ollama
        resp_json = resp.json()
        answer = resp_json.get("response", "").strip()
        
        logger.info("✓ Phi-3.5 response received (%d chars)", len(answer))
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