"""
Medicine OCR and Identification Service
Uses Google Vision OCR to read medicine packaging and Phi-4 LLM to analyze the medicine.
"""
import cv2
import numpy as np
import logging
import os
from typing import Dict, Any

from app.services.google_vision_ocr import GoogleVisionOCRService

logger = logging.getLogger(__name__)

def extract_text_from_image(image_array: np.ndarray) -> str:
    """
    Extract text from medicine packaging using Google Vision OCR only.
    
    Args:
        image_array: numpy array of image
    
    Returns:
        Extracted text from the image
    """
    vision_api_key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY", "").strip()
    if not vision_api_key:
        raise RuntimeError("GOOGLE_CLOUD_VISION_API_KEY not found. Google Vision OCR cannot run.")

    logger.info("🔍 Using Google Vision OCR for medicine identification")
    vision_result = GoogleVisionOCRService.extract_text_from_image(
        image_array,
        vision_api_key,
        language_hints=["en"],
    )
    vision_text = (vision_result.get("text") or "").strip()

    if vision_result.get("status") != "success" or len(vision_text) < 5:
        raise RuntimeError(
            f"Google Vision OCR failed or insufficient text. status={vision_result.get('status')} error={vision_result.get('error')}"
        )

    logger.info("✅ Google Vision OCR succeeded for medicine identification")
    return vision_text


def analyze_medicine_with_phi4(ocr_text: str) -> Dict[str, Any]:
    """
    Analyze medicine using integrated LLM + Unified Database system.
    Combines Phi-4 LLM with unified database (50K + 250K medicines).
    
    Args:
        ocr_text: Text extracted from medicine packaging
    
    Returns:
        Dictionary with comprehensive medicine information
    """
    from app.services.unified_medicine_database import UnifiedMedicineDatabase
    from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator
    
    logger.info(f"🔍 Starting comprehensive medicine analysis for OCR text: {ocr_text[:50]}...")
    
    # Step 1: Extract medicine name from OCR text
    medicine_name = extract_medicine_name(ocr_text)
    logger.info(f"📝 Extracted medicine name: {medicine_name}")
    
    # Step 2: Retrieve medicine data from Unified Database (50K + 250K medicines)
    medicine_info = UnifiedMedicineDatabase.get_medicine_info(medicine_name)
    logger.info(f"📊 Retrieved medicine data from unified database for: {medicine_info.get('name')}")
    
    # Step 3: Use Enhanced LLM to generate comprehensive information
    # Includes: precautions, dosage for adults/children/pregnancy, side effects, etc.
    result = EnhancedMedicineLLMGenerator.generate_comprehensive_info(ocr_text, medicine_info)
    logger.info(f"✅ Generated comprehensive medicine information: {result.get('medicine_name')}")
    
    return result


def extract_medicine_name(ocr_text: str) -> str:
    """
    Extract medicine name from OCR text
    
    Args:
        ocr_text: Raw OCR text from image
        
    Returns:
        Extracted medicine name
    """
    text_lower = ocr_text.lower()
    
    # Common medicine name patterns
    common_patterns = [
        "paracetamol", "cetirizine", "ibuprofen", "amoxicillin", 
        "metformin", "omeprazole", "aspirin", "acetaminophen",
        "cough", "cold", "fever", "pain", "allergy"
    ]
    
    # Check for common patterns
    for pattern in common_patterns:
        if pattern in text_lower:
            logger.info(f"Found common medicine pattern: {pattern}")
            return pattern
    
    # Try matching candidates against unified medicine database.
    try:
        from app.services.unified_medicine_database import UnifiedMedicineDatabase

        cleaned = ''.join(ch if (ch.isalnum() or ch.isspace()) else ' ' for ch in ocr_text)
        tokens = [t.lower().strip() for t in cleaned.split() if len(t.strip()) >= 3]

        stop_words = {
            'tablet', 'tab', 'capsule', 'cap', 'strip', 'mg', 'ml', 'g', 'mrp',
            'batch', 'exp', 'mfg', 'use', 'before', 'after', 'food', 'take', 'daily'
        }
        tokens = [t for t in tokens if t not in stop_words and not t.isdigit()]

        candidates = []
        candidates.extend(tokens)
        for i in range(len(tokens) - 1):
            candidates.append(f"{tokens[i]} {tokens[i+1]}")

        seen = set()
        for candidate in candidates:
            if candidate in seen:
                continue
            seen.add(candidate)
            if len(candidate) < 3:
                continue
            info = UnifiedMedicineDatabase.search_medicine(candidate)
            if info and isinstance(info, dict):
                return str(info.get('name') or info.get('Name') or candidate).lower()
    except Exception as e:
        logger.debug(f"Database-assisted extraction failed: {e}")

    # Extract first word or first significant word as final fallback.
    words = ocr_text.split()
    for word in words:
        if len(word) > 3:
            return word.lower()
    
    # Fallback to first word
    if words:
        return words[0].lower()
    
    return "unknown"


async def process_medicine_image(image_path: str) -> Dict[str, Any]:
    """
    Complete pipeline: OCR + LLM analysis of medicine image.
    
    Args:
        image_path: Path to medicine image
    
    Returns:
        Dictionary with complete medicine information
    """
    logger.info(f"Processing medicine image: {image_path}")
    
    try:
        # Step 1: Extract text
        logger.info("Step 1: Extracting text from image...")
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not read image file")
        
        ocr_text = extract_text_from_image(image)
        logger.info(f"OCR Text ({len(ocr_text)} chars): {ocr_text[:200]}")
        
        if len(ocr_text.strip()) < 5:
            logger.warning("OCR found very little text")
            return {
                "success": False,
                "error": "OCR could not read enough text from image",
                "message": "Please upload a clearer, well-lit image focused on medicine name"
            }
        
        # Step 2: Analyze with Phi-4
        logger.info("Step 2: Analyzing with Phi-4...")
        analysis = analyze_medicine_with_phi4(ocr_text)
        
        return {
            "success": True,
            "ocr_text": ocr_text,
            "analysis": analysis,
            "message": "Medicine identification successful"
        }
        
    except Exception as e:
        logger.error(f"Medicine processing failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to identify medicine. Please try with a clearer image."
        }
