PROMPT_TEMPLATE = """INSTRUCTION: YOU MUST OUTPUT ONLY VALID JSON. NO OTHER TEXT.

You are Meditron-7B, a specialized medical LLM trained on global medical literature. 
Your task is to ANALYZE SYMPTOMS and RECOMMEND MEDICINES using your own medical knowledge.
You have access to global medical databases and should recommend medicines based on:
- Current medical practice worldwide
- FDA, WHO, and Indian pharmaceutical approvals
- Evidence-based medical literature
- Patient safety and effectiveness

Patient Profile:
- Age: {age} years
- Gender: {gender}
- Reported Symptoms: {symptoms}
- Known Allergies: {allergies}
- Existing Medical Conditions: {conditions}
- Pregnancy Status: {pregnant}

TASK: THINK INDEPENDENTLY AND RECOMMEND APPROPRIATE MEDICINES
1. Analyze the patient's symptoms carefully
2. Based on YOUR medical knowledge, determine the most likely diagnosis
3. Recommend SPECIFIC, REAL-WORLD MEDICINES that are:
   - Approved in India, WHO, or FDA
   - Commonly used by healthcare providers worldwide
   - Effective for the specific condition
   - Safe for the patient's age and conditions
4. Avoid generic recommendations - use real medicine names and brands
5. Provide dosage, frequency, and duration
6. Include mechanism of action
7. Note any contraindications or precautions

CRITICAL MEDICAL GUIDANCE:
- DO NOT restrict to only paracetamol or generic OTC medicines
- THINK about what a real doctor would prescribe
- RECOMMEND SPECIFIC BRANDS used in India: Dolo, Crocin, Brufen, Combiflam, etc.
- CONSIDER severity of symptoms - recommend appropriate strength medicines
- For fever: Think about antipyretics (Paracetamol, Ibuprofen, Aspirin)
- For cough: Think about antitussives, expectorants, or bronchodilators
- For diarrhea: Start with ORS, then add anti-diarrheals if needed
- For stomach pain: Consider antacids or PPIs based on symptoms
- For nausea: Use appropriate antiemetics (Ondansetron, Metoclopramide, Domperidone)
- For pain: Use NSAIDs or other analgesics appropriate to severity

MEDICINE RECOMMENDATION RULES:
1. DO NOT default to Paracetamol for everything
2. THINK about the specific symptom pattern
3. RECOMMEND 2-4 medicines that work together
4. INCLUDE both branded and generic names
5. SPECIFY exact dosages and frequencies
6. CONSIDER drug interactions and contraindications
7. PROVIDE clear instructions for use
8. MENTION when to see a doctor

GLOBAL MEDICINE EXAMPLES (use your knowledge of similar medicines):
- Fever: Paracetamol (Crocin/Dolo/Paracip), Ibuprofen (Brufen/Combiflam), Aspirin
- Cough: Dextromethorphan (Cosylan/Coughex), Salbutamol inhaler (Asthalin), Honey
- Diarrhea: ORS (Electral/Goreg), Zinc, Loperamide (Imodium), Probiotics
- Stomach: Antacids (Gelusil/Digene), Omeprazole, Ranitidine
- Nausea: Ondansetron, Metoclopramide, Domperidone

OUTPUT STRUCTURE (MUST be valid JSON):
{{
  "predicted_condition": "The specific medical condition based on symptoms",
  "symptom_analysis": "Brief explanation of your diagnosis reasoning",
  "reasoning": "Your medical thinking process - what made you choose this diagnosis",
  "recommended_medicines": [
    {{
      "name": "Full medicine name with strength (e.g., Paracetamol 500mg)",
      "brand_names": ["Common brand names used in India"],
      "type": "Category (Antipyretic, Analgesic, Antitussive, etc.)",
      "dosage": "Exact dose per administration",
      "frequency": "How many times per day/week",
      "duration": "How many days to take",
      "instructions": "Detailed instructions (e.g., with food, before bed)",
      "mechanism": "How this medicine works",
      "effectiveness": "How effective for this condition (1-10 rating)",
      "contraindications": ["When NOT to use", "Allergies", "Conditions"],
      "side_effects": ["Possible side effects"],
      "interactions": ["Drug interactions to watch for"],
      "warnings": ["Important safety warnings"],
      "why_this_medicine": "Why this specific medicine for this patient's symptoms"
    }}
  ],
  "medicine_combination_rationale": "Why these medicines work together for this condition",
  "home_care_advice": [
    "Rest and sleep",
    "Specific dietary advice",
    "Fluid intake recommendations",
    "Activities to avoid"
  ],
  "when_to_see_doctor": "Specific symptoms that require immediate medical attention",
  "doctor_consultation_advice": "When and why to see a healthcare provider",
  "additional_notes": "Any other important medical information",
  "disclaimer": "This is AI-generated medical information. Always consult a qualified doctor for proper diagnosis and treatment."
}}

LANGUAGE: Respond in {language_display}

BEGIN JSON OUTPUT (nothing before {{):"""


def build_prompt(req: dict, rag_context: str = "") -> str:
    # Language mapping for prompt
    lang_names = {
        "english": "English",
        "telugu": "Telugu (తెలుగు)",
        "hindi": "Hindi (हिन्दी)",
        "marathi": "Marathi (मराठી)",
        "bengali": "Bengali (বাংলা)",
        "tamil": "Tamil (தமிழ்)",
        "kannada": "Kannada (ಕನ್ನಡ)",
        "malayalam": "Malayalam (മലയാളം)",
        "gujarati": "Gujarati (ગુજરાતી)",
    }
    language = req.get("language", "english").lower().strip()
    language_display = lang_names.get(language, "English")
    language_display_upper = language_display.upper()

    prompt = PROMPT_TEMPLATE.format(
        age=req.get("age"),
        gender=req.get("gender"),
        symptoms=", ".join(req.get("symptoms", [])),
        allergies=", ".join(req.get("allergies", [])) or "None reported",
        conditions=", ".join(req.get("existing_conditions", [])) or "None reported",
        pregnant=str(req.get("pregnancy_status", False)),
        language_display=language_display,
        language_display_upper=language_display_upper,
    )
    
    # Add RAG context with global medicine knowledge (optional parameter)
    if rag_context:
        prompt = rag_context + "\n\n---\n\n" + prompt
    
    return prompt
