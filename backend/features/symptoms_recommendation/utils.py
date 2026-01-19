import json
from typing import Any, Dict, List
import logging


logger = logging.getLogger(__name__)


def try_parse_json(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        # Try to extract a JSON substring
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            return json.loads(text[start:end])
        except Exception:
            logger.exception("Failed to parse JSON from LLM output")
            raise


def sanitize_medicine_name(name: str) -> str:
    return name.strip()


def generate_tts_payload(resp: Dict[str, Any]) -> str:
    parts: List[str] = []
    meds = resp.get("recommended_medicines", [])
    for m in meds:
        name = m.get("name")
        dosage = m.get("dosage")
        inst = m.get("instructions")
        if name:
            seg = f"Take {name}"
            if dosage:
                seg += f" {dosage}."
            if inst:
                seg += f" {inst}."
            parts.append(seg)

    parts += resp.get("home_care_advice", [])
    return " ".join(parts)
