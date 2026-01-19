from typing import List, Dict

UNSAFE_KEYWORDS = {
    "antibiotics": ["amoxicillin", "azithromycin", "ciprofloxacin", "penicillin"],
    "opioids": ["morphine", "oxycodone", "codeine"],
    "benzodiazepines": ["diazepam", "alprazolam"],
    "steroids": ["prednisone", "dexamethasone"],
}

EMERGENCY_SYMPTOMS = ["chest pain", "breathless", "breathlessness", "severe bleeding", "very high fever", "unconscious"]


def is_emergency(symptoms: List[str]) -> bool:
    s = " ".join([str(x).lower() for x in symptoms])
    for e in EMERGENCY_SYMPTOMS:
        if e in s:
            return True
    return False


def _contains_unsafe_med(name: str) -> bool:
    n = name.lower()
    for group in UNSAFE_KEYWORDS.values():
        for kw in group:
            if kw in n:
                return True
    return False


def filter_medicines(meds: List[Dict], allergies: List[str], pregnancy: bool, conditions: List[str]) -> List[Dict]:
    filtered = []
    allergy_set = {a.lower() for a in (allergies or [])}
    cond_set = {c.lower() for c in (conditions or [])}

    for m in meds:
        name = m.get("name", "").lower()
        if _contains_unsafe_med(name):
            continue
        # allergy conflict: if medicine name contains an allergy keyword, drop
        conflict = False
        for a in allergy_set:
            if a and a in name:
                conflict = True
                break
        if conflict:
            continue

        # simple pregnancy rules: avoid NSAID-like words (aspirin, ibuprofen)
        if pregnancy and any(x in name for x in ["ibuprofen", "aspirin", "naproxen"]):
            continue

        # chronic conditions: example diabetes -> avoid medicines with sugar or contraindicated notes
        if "diabetes" in cond_set and any(x in name for x in ["steroid"]):
            continue

        filtered.append(m)

    return filtered


def sanitize_response(resp: Dict, allergies: List[str], pregnancy: bool, conditions: List[str]) -> Dict:
    meds = resp.get("recommended_medicines", [])
    safe_meds = filter_medicines(meds, allergies, pregnancy, conditions)
    resp["recommended_medicines"] = safe_meds
    if is_emergency(resp.get("home_care_advice", []) + resp.get("recommended_medicines", [])):
        resp["doctor_consultation_advice"] = "Emergency: seek immediate medical attention."
    return resp
