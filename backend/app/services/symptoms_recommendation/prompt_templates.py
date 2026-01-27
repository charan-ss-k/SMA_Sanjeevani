PROMPT_TEMPLATE = """INSTRUCTION: YOU MUST OUTPUT ONLY VALID JSON. NO OTHER TEXT.

You are Sanjeevani, a medical assistant. Analyze symptoms and return ONLY a JSON object with medical recommendations.

Patient: {age} year old {gender}
Symptoms: {symptoms}
Allergies: {allergies}
Conditions: {conditions}
Pregnant: {pregnant}

CRITICAL - RESPOND WITH ONLY THIS JSON (no preamble, no explanation):
{{
  "predicted_condition": "most likely condition",
  "recommended_medicines": [
    {{
      "name": "medicine name with strength",
      "dosage": "dosage per dose",
      "duration": "number of days",
      "instructions": "when/how to take",
      "warnings": ["warning 1", "warning 2"]
    }}
  ],
  "home_care_advice": ["advice 1", "advice 2"],
  "doctor_consultation_advice": "when to see doctor",
  "disclaimer": "Not a professional diagnosis. See a doctor for proper evaluation."
}}

LANGUAGE: Respond in {language_display}
RULES:
- Only OTC medicines
- No antibiotics, opioids, or steroids
- Consider allergies and pregnancy
- Return ONLY the JSON object, nothing else
- No markdown, no code blocks, no explanation
- Start directly with {{ and end with }}

BEGIN JSON OUTPUT (nothing before {{):"""


def build_prompt(req: dict) -> str:
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
    language = req.get("language", "english").lower().strip()
    language_display = lang_names.get(language, "English")
    language_display_upper = language_display.upper()

    return PROMPT_TEMPLATE.format(
        age=req.get("age"),
        gender=req.get("gender"),
        symptoms=", ".join(req.get("symptoms", [])),
        allergies=", ".join(req.get("allergies", [])),
        conditions=", ".join(req.get("existing_conditions", [])),
        pregnant=str(req.get("pregnancy_status", False)),
        language_display=language_display,
        language_display_upper=language_display_upper,
    )
