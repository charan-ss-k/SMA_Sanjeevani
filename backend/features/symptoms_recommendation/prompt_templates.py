PROMPT_TEMPLATE = """You are a rural health assistant. Analyze and respond with JSON only.

Patient: {age} year old {gender}
Symptoms: {symptoms}
Allergies: {allergies}
Conditions: {conditions}
Pregnant: {pregnant}

MUST FOLLOW:
- Only OTC medicines (no antibiotics/opioids/steroids)
- Consider allergies and pregnancy
- Return ONLY valid JSON, no text before/after

JSON FORMAT:
{{
  "predicted_condition": "likely condition",
  "recommended_medicines": [
    {{
      "name": "medicine with strength",
      "dosage": "how much per dose",
      "duration": "how many days",
      "instructions": "when to take",
      "warnings": ["warning 1"]
    }}
  ],
  "home_care_advice": ["advice 1", "advice 2"],
  "doctor_consultation_advice": "when to see doctor",
  "disclaimer": "Not a professional diagnosis. See a doctor for proper evaluation."
}}"""


def build_prompt(req: dict) -> str:
    return PROMPT_TEMPLATE.format(
        age=req.get("age"),
        gender=req.get("gender"),
        symptoms=", ".join(req.get("symptoms", [])),
        allergies=", ".join(req.get("allergies", [])),
        conditions=", ".join(req.get("existing_conditions", [])),
        pregnant=str(req.get("pregnancy_status", False)),
    )
