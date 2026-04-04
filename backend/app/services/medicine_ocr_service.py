"""
Medicine OCR and Identification Service
Pipeline: image -> OCR text -> Phi-4 -> structured output.
Includes graceful fallback paths when external OCR/LLM services are unavailable.
"""

import cv2
import numpy as np
import logging
import os
import json
import re
import requests
from typing import Dict, Any

from app.services.google_vision_ocr import GoogleVisionOCRService
from app.services.unified_medicine_database import UnifiedMedicineDatabase
from app.services.medicine_csv_rag import MedicineCSVRAG

try:
    import easyocr
    HAVE_EASYOCR = True
except Exception:
    HAVE_EASYOCR = False

try:
    import pytesseract
    HAVE_TESSERACT = True
except Exception:
    HAVE_TESSERACT = False

logger = logging.getLogger(__name__)
_easyocr_reader = None


def extract_text_from_image(image_array: np.ndarray) -> str:
    """Extract OCR text from image with Google Vision first, then local fallback."""
    vision_api_key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY", "").strip()

    if vision_api_key:
        try:
            logger.info("🔍 Running Google Vision OCR for medicine identification")
            vision_result = GoogleVisionOCRService.extract_text_from_image(
                image_array,
                vision_api_key,
                language_hints=["en"],
            )

            vision_text = (vision_result.get("text") or "").strip()
            if vision_result.get("status") == "success" and len(vision_text) >= 5:
                logger.info("✅ OCR extraction complete via Google Vision")
                return vision_text

            logger.warning(
                "Google Vision OCR insufficient; falling back to local OCR. status=%s error=%s",
                vision_result.get("status"),
                vision_result.get("error"),
            )
        except Exception as exc:
            logger.warning("Google Vision OCR failed; falling back to local OCR: %s", exc)
    else:
        logger.warning("GOOGLE_CLOUD_VISION_API_KEY missing; using local OCR fallback")

    fallback_text = _extract_text_with_local_ocr(image_array)
    if len(fallback_text.strip()) < 5:
        raise RuntimeError(
            "OCR failed. Configure GOOGLE_CLOUD_VISION_API_KEY or install local OCR dependencies (easyocr/pytesseract)."
        )

    logger.info("✅ OCR extraction complete via local fallback")
    return fallback_text


async def process_medicine_image(image_path: str) -> Dict[str, Any]:
    """Complete pipeline: load image -> OCR -> Phi-4 -> return analysis."""
    logger.info(f"Processing medicine image: {image_path}")

    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not read image file")

        ocr_text = extract_text_from_image(image)
        logger.info("OCR text extracted from image")

        if len(ocr_text.strip()) < 5:
            return {
                "success": False,
                "error": "OCR could not read enough text from image",
                "message": "Please upload a clearer, well-lit image focused on the medicine label"
            }

        analysis = analyze_medicine_with_phi4(ocr_text)

        return {
            "success": True,
            "ocr_text": ocr_text,
            "analysis": analysis,
            "message": "Medicine identification successful"
        }

    except Exception as exc:
        logger.error(f"Medicine processing failed: {exc}")
        return {
            "success": False,
            "error": str(exc),
            "message": "Failed to identify medicine. Please try with a clearer image."
        }


def analyze_medicine_with_phi4(ocr_text: str) -> Dict[str, Any]:
    """Dataset-first medicine analysis with optional Phi-4 enrichment."""
    display_name = _extract_display_name_from_ocr(ocr_text)
    observed_strength = _extract_strength_from_ocr(ocr_text)

    dataset_info = _lookup_medicine_from_dataset(display_name)
    if dataset_info.get("found"):
        logger.info("✅ Dataset match found for medicine: %s", dataset_info.get("name"))
        result = _build_dataset_first_analysis(dataset_info, display_name, observed_strength, ocr_text)

        # Optional enrichment from LLM, but do not fail if unavailable.
        try:
            raw_model_output = _call_phi4(ocr_text)
            parsed = _parse_model_output(raw_model_output)
            for key in ["instructions", "precautions", "side_effects", "who_can_take", "warnings", "full_information", "sections"]:
                if key in parsed and parsed[key]:
                    result[key] = parsed[key]
            result["warnings"] = list(result.get("warnings", []))
            result["warnings"].insert(0, "Primary details are from medicine dataset; additional notes were AI-enriched.")
            result["generation_mode"] = "dataset_plus_phi4"
        except Exception as exc:
            result["warnings"] = list(result.get("warnings", []))
            result["warnings"].append(f"LLM enrichment unavailable: {str(exc)}")
            result["generation_mode"] = "dataset_only"

        return result

    logger.info("Dataset lookup did not find a confident match; using OCR/LLM fallback")

    try:
        raw_model_output = _call_phi4(ocr_text)
        parsed = _parse_model_output(raw_model_output)
    except Exception as exc:
        logger.warning("Phi-4 unavailable, returning fallback analysis: %s", exc)
        return _build_fallback_analysis(ocr_text, str(exc))

    # Brand/display name should come from OCR text, not model memory.

    parsed["medicine_name"] = display_name
    parsed["sections"]["MEDICINE NAME"] = display_name

    if observed_strength:
        parsed["dosage"] = observed_strength
        parsed["sections"]["DOSAGE"] = observed_strength

    parsed["source"] = "OCR text -> Phi-4 only"
    parsed["ocr_text"] = ocr_text
    parsed["generation_mode"] = "phi4_only"
    parsed.setdefault("warnings", [])
    parsed["warnings"] = list(parsed["warnings"])
    parsed["warnings"].insert(0, "This output was generated from OCR text using Phi-4 only.")

    logger.info(f"✅ Phi-4 analysis complete: {display_name}")
    return parsed


def _lookup_medicine_from_dataset(display_name: str) -> Dict[str, Any]:
    """Search unified dataset first, then legacy CSV dataset."""
    try:
        info = UnifiedMedicineDatabase.get_medicine_info(display_name)
        if info.get("found"):
            return info
    except Exception as exc:
        logger.warning("Unified dataset lookup failed: %s", exc)

    try:
        csv_info = MedicineCSVRAG.get_medicine_info(display_name)
        if csv_info.get("found"):
            return {
                "found": True,
                "name": csv_info.get("name", display_name),
                "category": csv_info.get("category", "Not specified"),
                "dosage_form": csv_info.get("dosage_form", "Not specified"),
                "strength": csv_info.get("strength", "Not specified"),
                "manufacturer": csv_info.get("manufacturer", "Not specified"),
                "indication": csv_info.get("indication", "Not specified"),
                "classification": csv_info.get("classification", "Not specified"),
                "source": "csv_database",
                "dataset_version": "legacy_csv",
            }
    except Exception as exc:
        logger.warning("CSV dataset lookup failed: %s", exc)

    return {"found": False}


def _build_dataset_first_analysis(dataset_info: Dict[str, Any], display_name: str, observed_strength: str, ocr_text: str) -> Dict[str, Any]:
    """Build output primarily from dataset search result."""
    medicine_name = dataset_info.get("name") or display_name or "Unknown"
    dosage = observed_strength or dataset_info.get("strength") or "Not specified"
    category = dataset_info.get("category") or dataset_info.get("type") or dataset_info.get("classification") or "Not specified"
    manufacturer = dataset_info.get("manufacturer") or "Not specified"
    price = dataset_info.get("price") or "Not specified"
    indication = dataset_info.get("indication") or "Not specified"

    summary = (
        f"Medicine matched from dataset: {medicine_name}. "
        f"Category: {category}. "
        f"Dosage/Strength: {dosage}. "
        f"Manufacturer: {manufacturer}. "
        f"Price: {price}. "
        f"Indication: {indication}."
    )

    return {
        "medicine_name": medicine_name,
        "type": dataset_info.get("dosage_form") or dataset_info.get("type") or "Not specified",
        "dosage": dosage,
        "who_can_take": "As prescribed by doctor",
        "instructions": "Use only as per prescription or package directions",
        "precautions": "Consult a qualified doctor before use",
        "side_effects": "Not specified",
        "category": category,
        "manufacturer": manufacturer,
        "price": price,
        "full_information": summary,
        "warnings": [
            "Information is retrieved from medicine dataset search.",
            "Always verify with package label and doctor advice.",
        ],
        "sections": {
            "MEDICINE NAME": medicine_name,
            "TYPE": dataset_info.get("dosage_form") or dataset_info.get("type") or "Not specified",
            "DOSAGE": dosage,
            "WHO CAN TAKE & AGE RESTRICTIONS": "As prescribed by doctor",
            "INSTRUCTIONS": "Use only as per prescription or package directions",
            "PRECAUTIONS": "Consult a qualified doctor before use",
            "SIDE EFFECTS": "Not specified",
        },
        "source": f"dataset_search ({dataset_info.get('source', 'database')})",
        "ocr_text": ocr_text,
        "dataset_version": dataset_info.get("dataset_version", "unknown"),
    }


def _extract_text_with_local_ocr(image_array: np.ndarray) -> str:
    """Fallback OCR using EasyOCR first and Tesseract second."""
    texts = []

    if HAVE_EASYOCR:
        try:
            global _easyocr_reader
            if _easyocr_reader is None:
                _easyocr_reader = easyocr.Reader(['en'], gpu=False)

            results = _easyocr_reader.readtext(image_array)
            easy_lines = [item[1].strip() for item in results if len(item) >= 2 and item[1].strip()]
            if easy_lines:
                texts.append("\n".join(easy_lines))
        except Exception as exc:
            logger.warning("EasyOCR fallback failed: %s", exc)

    if HAVE_TESSERACT:
        try:
            gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (3, 3), 0)
            tesseract_text = pytesseract.image_to_string(gray, lang='eng', config='--oem 1 --psm 6').strip()
            if tesseract_text:
                texts.append(tesseract_text)
        except Exception as exc:
            logger.warning("Tesseract fallback failed: %s", exc)

    if not texts:
        return ""

    return max(texts, key=lambda value: len(value.strip())).strip()


def _build_fallback_analysis(ocr_text: str, llm_error: str) -> Dict[str, Any]:
    """Build a safe response when LLM backend is unavailable."""
    display_name = _extract_display_name_from_ocr(ocr_text)
    observed_strength = _extract_strength_from_ocr(ocr_text) or "Not specified"
    summary = " ".join(ocr_text.split())[:600] if ocr_text else "Not specified"

    return {
        "medicine_name": display_name,
        "type": "Not specified",
        "dosage": observed_strength,
        "who_can_take": "Not specified",
        "instructions": "Refer package label or doctor prescription",
        "precautions": "Consult a qualified doctor before use",
        "side_effects": "Not specified",
        "category": "Not specified",
        "manufacturer": "Not specified",
        "price": "Not specified",
        "full_information": summary,
        "warnings": [
            "LLM backend was unavailable. Showing OCR-based fallback output.",
            f"Backend error: {llm_error}",
        ],
        "sections": {
            "MEDICINE NAME": display_name,
            "TYPE": "Not specified",
            "DOSAGE": observed_strength,
            "WHO CAN TAKE & AGE RESTRICTIONS": "Not specified",
            "INSTRUCTIONS": "Refer package label or doctor prescription",
            "PRECAUTIONS": "Consult a qualified doctor before use",
            "SIDE EFFECTS": "Not specified",
        },
        "source": "OCR text fallback",
        "ocr_text": ocr_text,
        "generation_mode": "fallback_no_llm",
    }


def _call_phi4(ocr_text: str) -> str:
    """Call Phi-4 via Ollama or Azure OpenAI. No dataset/RAG path is used."""
    provider = os.getenv("LLM_PROVIDER", "ollama").lower().strip()

    prompt = f"""
You are analyzing a medicine package image.

Use ONLY the OCR text below. Do not use any dataset, memory, previous examples, or medical guesses.

OCR TEXT:
{ocr_text}

Critical rules:
- Preserve the visible brand/product name exactly as OCR shows it.
- If the OCR text shows a strength like 650 mg, do not change it to another strength.
- If a field is not visible in OCR text, output "Not specified".
- Do not infer the medicine from your memory. Base everything on the OCR text only.

Return ONLY valid JSON with this schema:
{{
  "medicine_name": "brand/product name visible in OCR",
  "type": "tablet / capsule / syrup / etc or Not specified",
  "dosage": "OCR-visible strength or dosage, or Not specified",
  "who_can_take": "OCR-visible age/usage info or Not specified",
  "instructions": "OCR-visible instructions or Not specified",
  "precautions": "OCR-visible precautions or Not specified",
  "side_effects": "OCR-visible side effects or Not specified",
  "category": "Not specified if absent from OCR",
  "manufacturer": "OCR-visible manufacturer or Not specified",
  "price": "OCR-visible price or Not specified",
  "full_information": "full readable summary using only the OCR text",
  "warnings": ["array of caution messages based only on OCR text"],
  "sections": {{
    "MEDICINE NAME": "exact brand/product name from OCR",
    "TYPE": "type or Not specified",
    "DOSAGE": "OCR-visible strength or dosage or Not specified",
    "WHO CAN TAKE & AGE RESTRICTIONS": "OCR-visible info or Not specified",
    "INSTRUCTIONS": "OCR-visible info or Not specified",
    "PRECAUTIONS": "OCR-visible info or Not specified",
    "SIDE EFFECTS": "OCR-visible info or Not specified"
  }}
}}

Remember: do not use dataset knowledge or replace the visible brand name with an ingredient name.
""".strip()

    if provider == "azure_openai":
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
        api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "Sanjeevani-Phi-4").strip()

        if not endpoint or not api_key:
            raise RuntimeError("Azure OpenAI credentials are not configured")

        base_endpoint = endpoint.replace("/openai/v1/", "").rstrip("/")
        api_url = f"{base_endpoint}/openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview"

        response = requests.post(
            api_url,
            headers={
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            json={
                "messages": [
                    {"role": "system", "content": "Return valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 1800,
            },
            timeout=(15, 90),
        )

        if response.status_code != 200:
            raise RuntimeError(f"Azure OpenAI error {response.status_code}: {response.text[:500]}")

        content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        if not content:
            raise RuntimeError("Azure OpenAI returned empty content")
        return content

    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
    response = requests.post(
        f"{ollama_url}/api/generate",
        json={
            "model": "phi4",
            "prompt": prompt,
            "stream": False,
            "temperature": 0.1,
            "num_predict": 1800,
        },
        timeout=(10, 90),
    )

    if response.status_code != 200:
        raise RuntimeError(f"Ollama error {response.status_code}: {response.text[:500]}")

    content = response.json().get("response", "")
    if not content:
        raise RuntimeError("Ollama returned empty response")

    return content


def _parse_model_output(model_output: str) -> Dict[str, Any]:
    """Parse Phi-4 JSON output and normalize the schema."""
    parsed = _extract_first_json(model_output)

    normalized = {
        "medicine_name": parsed.get("medicine_name", "Unknown"),
        "type": parsed.get("type", "Not specified"),
        "dosage": parsed.get("dosage", "Not specified"),
        "who_can_take": parsed.get("who_can_take", "Not specified"),
        "instructions": parsed.get("instructions", "Not specified"),
        "precautions": parsed.get("precautions", "Not specified"),
        "side_effects": parsed.get("side_effects", "Not specified"),
        "category": parsed.get("category", "Not specified"),
        "manufacturer": parsed.get("manufacturer", "Not specified"),
        "price": parsed.get("price", "Not specified"),
        "full_information": parsed.get("full_information", model_output.strip()),
        "warnings": parsed.get("warnings", []),
        "sections": parsed.get("sections", {}),
    }

    if not isinstance(normalized["warnings"], list):
        normalized["warnings"] = [str(normalized["warnings"])] if normalized["warnings"] else []

    if not isinstance(normalized["sections"], dict):
        normalized["sections"] = {}

    normalized["sections"].setdefault("MEDICINE NAME", normalized["medicine_name"])
    normalized["sections"].setdefault("TYPE", normalized["type"])
    normalized["sections"].setdefault("DOSAGE", normalized["dosage"])
    normalized["sections"].setdefault("WHO CAN TAKE & AGE RESTRICTIONS", normalized["who_can_take"])
    normalized["sections"].setdefault("INSTRUCTIONS", normalized["instructions"])
    normalized["sections"].setdefault("PRECAUTIONS", normalized["precautions"])
    normalized["sections"].setdefault("SIDE EFFECTS", normalized["side_effects"])

    return normalized


def _extract_first_json(text: str) -> Dict[str, Any]:
    """Extract the first JSON object from a model response."""
    if not text:
        return {}

    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {}

    try:
        return json.loads(match.group(0))
    except Exception:
        return {}


def _extract_display_name_from_ocr(ocr_text: str) -> str:
    """Extract the most likely visible product/brand name from OCR text."""
    lines = [line.strip() for line in ocr_text.splitlines() if line.strip()]
    if not lines:
        return "Unknown"

    # Prefer prominent product lines, not ingredient-only lines.
    preferred_tokens = ["day & night", "day and night", "cold & flu", "cold and flu", "cough", "medicine"]
    best_line = lines[0]
    best_score = float("-inf")

    for line in lines:
        score = 0
        lowered = line.lower()

        if any(token in lowered for token in preferred_tokens):
            score += 6
        if any(char.isupper() for char in line):
            score += 2
        if len(line.split()) >= 2:
            score += 1
        if re.search(r"\b\d+(?:\.\d+)?\s?(?:mg|ml|g|mcg)\b", line, re.IGNORECASE):
            score -= 3
        if re.search(r"\b(paracetamol|acetaminophen|ibuprofen|amoxicillin|cetirizine|aspirin)\b", lowered):
            score -= 1

        if score > best_score:
            best_score = score
            best_line = line

    best_line = re.sub(r"\s*\b\d+(?:\.\d+)?\s?(?:mg|ml|g|mcg)\b.*$", "", best_line, flags=re.IGNORECASE).strip()
    return best_line[:120] if best_line else lines[0][:120]


def _extract_strength_from_ocr(ocr_text: str) -> str:
    """Extract a visible strength/dose from OCR text, e.g. 650 mg or 5 ml."""
    if not ocr_text:
        return ""

    patterns = [
        r"\b\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|units)\b",
        r"\b(?:ip\s*)?\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml)\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, ocr_text, re.IGNORECASE)
        if match:
            return match.group(0).replace("  ", " ").strip()

    return ""
