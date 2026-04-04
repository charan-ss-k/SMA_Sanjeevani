"""
Medicine OCR and Identification Service
Pipeline: image -> OCR text -> Phi-4 -> structured response
"""

import json
import logging
import os
import re
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np
import requests

from app.services.google_vision_ocr import GoogleVisionOCRService

logger = logging.getLogger(__name__)

_MEDICAL_OCR_HINTS = ["tablet", "capsule", "syrup", "mg", "ml", "ip", "rx", "dosage"]
_COMMON_BRAND_FIXES = {
    r"\bcetrizine\b": "cetirizine",
    r"\bparacetmol\b": "paracetamol",
    r"\bazithromicin\b": "azithromycin",
    r"\bamoxycillin\b": "amoxicillin",
}


def _prepare_ocr_variants(image_array: np.ndarray) -> List[Tuple[str, np.ndarray]]:
    """Create OCR-friendly image variants to improve recognition robustness."""
    variants: List[Tuple[str, np.ndarray]] = [("original", image_array)]

    try:
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY) if len(image_array.shape) == 3 else image_array

        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # Convert back to 3-channel for consistent OCR handling.
        enhanced_bgr = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        variants.append(("enhanced", enhanced_bgr))

        h, w = image_array.shape[:2]
        if max(h, w) < 1200:
            scale = 1200.0 / float(max(h, w))
            upscaled = cv2.resize(enhanced_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
            variants.append(("upscaled", upscaled))
    except Exception as exc:
        logger.warning("Failed to build OCR variants: %s", exc)

    return variants


def _clean_ocr_text(text: str) -> str:
    cleaned = (text or "").replace("\x0c", " ")
    cleaned = re.sub(r"[\t\r]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ ]{2,}", " ", cleaned)
    return cleaned.strip()


def _score_ocr_text(text: str) -> float:
    """Heuristic quality score in [0,1] for selecting best OCR output."""
    if not text:
        return 0.0

    normalized = text.lower()
    chars = len(text)
    words = len(re.findall(r"\b\w+\b", text))
    lines = len([ln for ln in text.splitlines() if ln.strip()])

    score = 0.0
    score += min(0.35, chars / 220.0)
    score += min(0.2, words / 30.0)
    score += min(0.15, lines / 8.0)

    if re.search(r"\b\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|units)\b", normalized):
        score += 0.15
    if any(token in normalized for token in _MEDICAL_OCR_HINTS):
        score += 0.1

    bad_chars_ratio = len(re.findall(r"[^\w\s.,:/()\-+%]", text)) / max(chars, 1)
    score -= min(0.2, bad_chars_ratio)

    return max(0.0, min(1.0, score))


def _correct_common_ocr_errors(text: str) -> str:
    fixed = text
    for pattern, replacement in _COMMON_BRAND_FIXES.items():
        fixed = re.sub(pattern, replacement, fixed, flags=re.IGNORECASE)
    return fixed


def _extract_with_google_vision(image_array: np.ndarray, api_key: str) -> Dict[str, Any]:
    result = GoogleVisionOCRService.extract_text_from_image(
        image_array,
        api_key,
        language_hints=["en"],
    )
    text = _clean_ocr_text(result.get("text", ""))
    return {
        "engine": "google_vision",
        "status": result.get("status", "error"),
        "text": text,
        "error": result.get("error", ""),
        "confidence": float(result.get("confidence", 0.0) or 0.0),
    }


def _extract_with_local_ocr(image_array: np.ndarray) -> Dict[str, Any]:
    from app.services.multimethod_ocr import MultiMethodHandwrittenOCR

    result = MultiMethodHandwrittenOCR(languages=["en"]).extract_text_multimethod(image_array)
    text = _clean_ocr_text(result.get("text", ""))
    return {
        "engine": "local_multimethod",
        "status": "success" if text else "error",
        "text": text,
        "error": result.get("error", "") if isinstance(result, dict) else "",
        "confidence": float(result.get("confidence", 0.0) or 0.0) if isinstance(result, dict) else 0.0,
    }


def extract_text_from_image(image_array: np.ndarray) -> str:
    """
    Extract raw OCR text from medicine image.
    Strategy: Google Vision first, then local multimethod OCR fallback, choose best-scoring text.
    """
    vision_api_key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY", "").strip()
    variants = _prepare_ocr_variants(image_array)
    candidates: List[Dict[str, Any]] = []

    # 1) Google Vision on image variants (when key is available)
    if vision_api_key:
        for variant_name, variant in variants:
            google = _extract_with_google_vision(variant, vision_api_key)
            if google["text"]:
                score = _score_ocr_text(google["text"]) + (0.15 * min(1.0, google["confidence"]))
                candidates.append({
                    "engine": f"{google['engine']}:{variant_name}",
                    "text": google["text"],
                    "score": score,
                    "status": google["status"],
                    "error": google["error"],
                })

            if google["status"] == "error":
                logger.warning("Google Vision failed on %s variant: %s", variant_name, google["error"])
    else:
        logger.warning("GOOGLE_CLOUD_VISION_API_KEY missing; using local OCR fallback")

    # 2) If Google result is absent/weak, try local multimethod OCR on enhanced variant.
    best_google_score = max([c["score"] for c in candidates], default=0.0)
    if best_google_score < 0.58:
        local_variant = next((arr for name, arr in variants if name == "enhanced"), image_array)
        try:
            local = _extract_with_local_ocr(local_variant)
            if local["text"]:
                local_score = _score_ocr_text(local["text"]) + (0.1 * min(1.0, local["confidence"]))
                candidates.append({
                    "engine": local["engine"],
                    "text": local["text"],
                    "score": local_score,
                    "status": local["status"],
                    "error": local["error"],
                })
        except Exception as exc:
            logger.warning("Local multimethod OCR fallback failed: %s", exc)

    if not candidates:
        raise RuntimeError("OCR could not extract readable text from the image")

    best = max(candidates, key=lambda c: c["score"])
    selected_text = _correct_common_ocr_errors(best["text"])

    logger.info(
        "OCR selected engine=%s score=%.3f chars=%d",
        best["engine"],
        best["score"],
        len(selected_text),
    )

    if len(selected_text.strip()) < 5:
        raise RuntimeError("OCR extracted insufficient text")

    return selected_text


async def process_medicine_image(image_path: str) -> Dict[str, Any]:
    """Complete pipeline: load image -> OCR -> Phi-4 -> return analysis."""
    logger.info("Processing medicine image: %s", image_path)

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
                "message": "Please upload a clearer, well-lit image focused on the medicine label",
            }

        analysis = analyze_medicine_with_phi4(ocr_text)

        return {
            "success": True,
            "ocr_text": ocr_text,
            "analysis": analysis,
            "message": "Medicine identification successful",
        }

    except Exception as exc:
        logger.error("Medicine processing failed: %s", exc)
        return {
            "success": False,
            "error": str(exc),
            "message": "Failed to identify medicine. Please try with a clearer image.",
        }


def analyze_medicine_with_phi4(ocr_text: str) -> Dict[str, Any]:
    """Send OCR text to Phi-4 and return the structured response."""
    logger.info("Sending OCR text to Phi-4. Length=%d", len(ocr_text))
    raw_model_output = _call_phi4(ocr_text)
    parsed = _parse_model_output(raw_model_output)

    display_name = _extract_display_name_from_ocr(ocr_text)
    observed_strength = _extract_strength_from_ocr(ocr_text)

    parsed["medicine_name"] = display_name
    parsed.setdefault("sections", {})
    parsed["sections"]["MEDICINE NAME"] = display_name

    if observed_strength:
        parsed["dosage"] = observed_strength
        parsed["sections"]["DOSAGE"] = observed_strength

    parsed["source"] = "OCR text -> Phi-4 only"
    parsed["ocr_text"] = ocr_text
    parsed["generation_mode"] = "phi4_only"
    parsed.setdefault("warnings", [])
    parsed["warnings"] = list(parsed["warnings"])
    parsed["warnings"].insert(0, "Generated from OCR text using Phi-4. Verify with physical medicine label.")

    logger.info("Phi-4 analysis complete: %s", display_name)
    return parsed


def _call_phi4(ocr_text: str) -> str:
    """Call Phi-4 via Ollama or Azure OpenAI."""
    provider = os.getenv("LLM_PROVIDER", "ollama").lower().strip()

    prompt = f"""
You are analyzing a medicine package image.

Use ONLY the OCR text below. Do not use external memory or guesses.

OCR TEXT:
{ocr_text}

Critical rules:
- Preserve visible brand/product name exactly from OCR.
- Keep visible strength exactly as written (e.g., 650 mg).
- If not visible in OCR, return "Not specified".

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
  "full_information": "summary using only OCR text",
  "warnings": ["caution messages based only on OCR text"],
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
            headers={"Content-Type": "application/json", "api-key": api_key},
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
    """Parse Phi-4 JSON output and normalize schema."""
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
    """Pick best candidate line for visible brand/product name."""
    lines = [line.strip() for line in ocr_text.splitlines() if line.strip()]
    if not lines:
        return "Unknown"

    stop_terms = {
        "composition", "ingredients", "warning", "caution", "batch", "mfg", "exp", "mrp", "dosage",
        "schedule", "storage", "keep out", "manufactured", "marketed", "directions",
    }

    best_line = lines[0]
    best_score = float("-inf")

    for line in lines:
        lowered = line.lower()
        score = 0.0

        if any(term in lowered for term in stop_terms):
            score -= 4.0
        if re.search(r"\b\d+(?:\.\d+)?\s?(?:mg|mcg|ml|g)\b", lowered):
            score -= 1.5
        if len(line) > 3:
            score += 1.0
        if 2 <= len(line.split()) <= 6:
            score += 1.0
        if any(ch.isupper() for ch in line):
            score += 0.8
        if re.search(r"^[A-Za-z][A-Za-z0-9\-\s&+/]{2,}$", line):
            score += 1.2

        if score > best_score:
            best_score = score
            best_line = line

    best_line = re.sub(r"\s*\b\d+(?:\.\d+)?\s?(?:mg|mcg|ml|g)\b.*$", "", best_line, flags=re.IGNORECASE).strip()
    best_line = _correct_common_ocr_errors(best_line)
    return best_line[:120] if best_line else lines[0][:120]


def _extract_strength_from_ocr(ocr_text: str) -> str:
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
