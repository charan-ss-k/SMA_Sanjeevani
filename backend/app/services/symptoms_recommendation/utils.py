import json
from typing import Any, Dict, List
import logging


logger = logging.getLogger(__name__)


def try_parse_json(text: str) -> Dict[str, Any]:
    """
    Try to parse JSON from text, handling LLM preambles and system prompts.
    Meditron and other models sometimes output system text before JSON.
    """
    text = text.strip()
    
    # Direct JSON parse attempt first
    try:
        return json.loads(text)
    except Exception:
        pass
    
    # Try to extract a JSON substring (skip preambles like "A chat between...")
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        json_str = text[start:end]
        return json.loads(json_str)
    except ValueError:
        # No JSON found at all
        logger.error("No JSON object found in LLM output")
        logger.error("LLM output: %s", text[:500])
        raise ValueError("No JSON found in LLM output. Model may have output system prompt instead of JSON.")
    except Exception as e:
        logger.exception("Failed to parse extracted JSON from LLM output: %s", str(e))
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
