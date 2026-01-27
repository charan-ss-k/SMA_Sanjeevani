"""
Medicine OCR and Identification Service
Uses OCR to read medicine packaging and Phi-4 LLM to analyze the medicine
"""
import cv2
import numpy as np
import logging
import os
import tempfile
from typing import Dict, Any
import requests

logger = logging.getLogger(__name__)

# Try to import pytesseract (optional, falls back to easyocr)
HAVE_PYTESSERACT = False
try:
    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    HAVE_PYTESSERACT = True
    logger.info("✅ Pytesseract loaded successfully")
except Exception as e:
    logger.debug(f"⚠️ Pytesseract not available: {e}")

# EasyOCR support (primary OCR engine)
HAVE_EASYOCR = False
try:
    import easyocr
    HAVE_EASYOCR = True
    logger.info("✅ EasyOCR loaded successfully")
except ImportError:
    logger.error("❌ EasyOCR not installed - OCR features will not work")


def preprocess_image_multiple_methods(image_array: np.ndarray) -> list:
    """
    Try multiple preprocessing strategies for medicine packaging OCR.
    Handles reflective surfaces, blister packs, prescriptions, bottles.
    
    Args:
        image_array: numpy array of image (from cv2.imread or PIL)
    
    Returns:
        list of (method_name, processed_image) tuples
    """
    if isinstance(image_array, str):
        # If it's a path, read it
        img = cv2.imread(image_array)
    else:
        img = image_array
    
    if img is None:
        raise ValueError("Could not load image")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    results = []
    
    # METHOD 1: Mild denoise + grayscale
    mild_denoise = cv2.fastNlMeansDenoising(gray, None, h=8, templateWindowSize=7, searchWindowSize=21)
    results.append(('Gray Denoised', mild_denoise))
    
    # METHOD 2: CLAHE + OTSU
    clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
    clahe_img = clahe.apply(mild_denoise)
    blurred = cv2.GaussianBlur(clahe_img, (3, 3), 0)
    _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results.append(('CLAHE OTSU', otsu))
    
    # METHOD 3: CLAHE + Adaptive Mean
    adaptive = cv2.adaptiveThreshold(
        clahe_img, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        21, 10
    )
    results.append(('CLAHE Adaptive Mean', adaptive))
    
    # METHOD 4: Inverted OTSU
    inverted = cv2.bitwise_not(otsu)
    results.append(('Inverted OTSU', inverted))
    
    return results


def extract_text_from_image(image_array: np.ndarray) -> str:
    """
    Extract text from medicine packaging using OCR.
    Tries multiple preprocessing and OCR methods to get best result.
    
    Args:
        image_array: numpy array of image
    
    Returns:
        Extracted text from the image
    """
    logger.info(f"📷 Starting OCR extraction. Pytesseract: {HAVE_PYTESSERACT}, EasyOCR: {HAVE_EASYOCR}")
    
    try:
        preprocessed_images = preprocess_image_multiple_methods(image_array)
    except Exception as e:
        logger.error(f"Preprocessing failed: {e}")
        raise
    
    best_text = ""
    best_length = 0
    best_method = ""
    all_texts = []
    
    # Try Tesseract first if available
    if HAVE_PYTESSERACT:
        logger.info("🔍 Trying Tesseract OCR...")
        psm_modes = [
            ('Auto', 3),
            ('Single Block', 6),
            ('Single Line', 7),
            ('Sparse Text', 11)
        ]
        
        # Try all preprocessing + PSM combinations
        for method_name, processed_img in preprocessed_images:
            for psm_name, psm_mode in psm_modes:
                try:
                    config = f'--oem 3 --psm {psm_mode}'
                    text = pytesseract.image_to_string(processed_img, config=config)
                    text = " ".join(text.split())  # Clean whitespace
                    all_texts.append(text)
                    
                    if len(text) > best_length:
                        best_length = len(text)
                        best_text = text
                        best_method = f"{method_name} + PSM {psm_mode}"
                except Exception as e:
                    logger.debug(f"PSM {psm_mode} failed: {e}")
                    continue
    
    # Try EasyOCR as fallback or primary if Tesseract unavailable
    if HAVE_EASYOCR:
        logger.info("🔍 Trying EasyOCR...")
        try:
            if not hasattr(extract_text_from_image, '_easyocr_reader'):
                logger.info("📥 Loading EasyOCR reader...")
                extract_text_from_image._easyocr_reader = easyocr.Reader(['en'], gpu=False)
            
            reader = extract_text_from_image._easyocr_reader
            
            # Ensure proper image format
            if len(image_array.shape) == 2:
                img_rgb = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)
            else:
                img_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            
            text_list = reader.readtext(img_rgb, detail=0, paragraph=True)
            text = " ".join(text_list)
            text = " ".join(text.split())
            all_texts.append(text)
            
            if len(text) > best_length:
                best_length = len(text)
                best_text = text
                best_method = "EasyOCR"
        except Exception as e:
            logger.warning(f"EasyOCR failed: {e}")
    
    logger.info(f"Best OCR result: {best_method} ({best_length} chars)")
    
    if best_length < 5:
        logger.warning("OCR found very little text, result may be poor")
    
    return best_text


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
    
    # Extract first word or first significant word
    words = ocr_text.split()
    for word in words:
        if len(word) > 3:  # Prefer words longer than 3 characters
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
        
        if len(ocr_text) < 5:
            logger.warning("OCR found very little text")
        
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
