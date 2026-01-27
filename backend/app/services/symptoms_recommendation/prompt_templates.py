PROMPT_TEMPLATE = """INSTRUCTION: YOU MUST OUTPUT ONLY VALID JSON. NO OTHER TEXT.

You are Phi-4, a medical expert AI trained on global medical knowledge and pharmaceutical databases.
Your task is to analyze patient symptoms and recommend appropriate medicines using your own independent medical reasoning.

Patient Information:
- Age: {age} years
- Gender: {gender}
- Reported Symptoms: {symptoms}
- Known Allergies: {allergies}
- Existing Medical Conditions: {conditions}
- Pregnancy Status: {pregnant}

TASK: ANALYZE SYMPTOMS AND RECOMMEND MEDICINES
1. Carefully analyze the provided symptoms
2. Using YOUR medical knowledge, determine the most likely condition
3. Recommend 2-4 appropriate, real-world medicines that would be prescribed for this condition
4. Consider the patient's age, allergies, existing conditions, and pregnancy status
5. Provide specific medicine names with dosages used in medical practice
6. Include mechanism of action and why each medicine is appropriate
7. Note any contraindications or special precautions for this patient
8. Provide clear usage instructions

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
    
    # RAG context is NOT used - Phi-4 thinks independently
    return prompt
