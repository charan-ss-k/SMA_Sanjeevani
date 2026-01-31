"""
Hybrid OCR Service - Detects printed vs handwritten and uses appropriate OCR
Supports: Tesseract (printed), EasyOCR (printed), TrOCR (handwritten)
"""

import cv2
import numpy as np
import logging
from typing import Dict, Any, Tuple
from PIL import Image
import tempfile
import os

logger = logging.getLogger(__name__)

# Try importing OCR libraries
HAVE_TESSERACT = False
HAVE_EASYOCR = False
HAVE_TROCR = False

try:
    import pytesseract
    HAVE_TESSERACT = True
    logger.info("✅ Tesseract OCR available")
except ImportError:
    logger.warning("⚠️ pytesseract not installed")

try:
    import easyocr
    HAVE_EASYOCR = True
    logger.info("✅ EasyOCR available")
except ImportError:
    logger.warning("⚠️ EasyOCR not installed")

try:
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    import torch
    HAVE_TROCR = True
    logger.info("✅ TrOCR available")
except ImportError:
    logger.warning("⚠️ TrOCR not installed")


class HybridPrescriptionOCR:
    """
    Smart OCR that automatically selects the best engine:
    - Printed text → Tesseract or EasyOCR (faster, more accurate for printed)
    - Handwritten text → TrOCR (specialized for handwriting)
    """
    
    _easyocr_reader = None
    _trocr_model = None
    _trocr_processor = None
    
    @staticmethod
    def process_prescription(image_path: str) -> Dict[str, Any]:
        """
        Main entry point: detect type and extract text with best OCR.
        
        Args:
            image_path: Path to prescription image
            
        Returns:
            Dictionary with OCR results
        """
        logger.info(f"🏥 Processing prescription: {image_path}")
        
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image from {image_path}")
            
            # Detect if handwritten or printed
            is_handwritten = HybridPrescriptionOCR._detect_handwritten(image)
            
            if is_handwritten:
                logger.info("📝 Detected: HANDWRITTEN prescription")
                return HybridPrescriptionOCR._process_handwritten(image_path)
            else:
                logger.info("🖨️ Detected: PRINTED prescription")
                return HybridPrescriptionOCR._process_printed(image)
                
        except Exception as e:
            logger.error(f"❌ Prescription processing failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "ocr_text": "",
                "text_lines": []
            }
    
    @staticmethod
    def _detect_handwritten(image: np.ndarray) -> bool:
        """
        Detect if prescription is handwritten or printed.
        Uses edge density and stroke consistency analysis.
        """
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            # Calculate edge density
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Calculate variance of pixel intensities
            variance = np.var(gray)
            
            # Heuristic: Handwritten tends to have higher edge density and variance
            # Printed text is more uniform
            is_handwritten = edge_density > 0.05 or variance > 2000
            
            logger.debug(f"Edge density: {edge_density:.4f}, Variance: {variance:.2f}")
            logger.debug(f"Classification: {'Handwritten' if is_handwritten else 'Printed'}")
            
            return is_handwritten
            
        except Exception as e:
            logger.warning(f"Detection failed: {e}. Defaulting to printed.")
            return False
    
    @staticmethod
    def _process_printed(image: np.ndarray) -> Dict[str, Any]:
        """
        Process printed prescription using Tesseract or EasyOCR.
        """
        logger.info("Using OCR for PRINTED text...")
        
        # Preprocess for better OCR
        preprocessed = HybridPrescriptionOCR._preprocess_for_tesseract(image)
        
        # Try Tesseract first (fastest)
        if HAVE_TESSERACT:
            try:
                logger.info("🔍 Using Tesseract OCR...")
                text = pytesseract.image_to_string(preprocessed, lang='eng', config='--psm 6')
                
                if text and len(text.strip()) > 10:
                    lines = [line.strip() for line in text.split('\n') if line.strip()]
                    logger.info(f"✅ Tesseract extracted {len(lines)} lines")
                    return {
                        "status": "success",
                        "ocr_text": text.strip(),
                        "text_lines": lines,
                        "method": "Tesseract",
                        "prescription_type": "printed"
                    }
            except Exception as e:
                logger.warning(f"⚠️ Tesseract failed: {e}")
        
        # Fallback to EasyOCR
        if HAVE_EASYOCR:
            try:
                logger.info("🔍 Using EasyOCR...")
                if HybridPrescriptionOCR._easyocr_reader is None:
                    HybridPrescriptionOCR._easyocr_reader = easyocr.Reader(['en'])
                
                result = HybridPrescriptionOCR._easyocr_reader.readtext(preprocessed)
                
                # Extract text from results
                lines = [text for (bbox, text, conf) in result if conf > 0.3]
                full_text = '\n'.join(lines)
                
                logger.info(f"✅ EasyOCR extracted {len(lines)} lines")
                return {
                    "status": "success",
                    "ocr_text": full_text,
                    "text_lines": lines,
                    "method": "EasyOCR",
                    "prescription_type": "printed"
                }
            except Exception as e:
                logger.error(f"❌ EasyOCR failed: {e}")
        
        # No OCR available
        return {
            "status": "error",
            "error": "No OCR engine available for printed text. Install pytesseract or easyocr.",
            "ocr_text": "",
            "text_lines": []
        }
    
    @staticmethod
    def _process_handwritten(image_path: str) -> Dict[str, Any]:
        """
        Process handwritten prescription using TrOCR.
        """
        if not HAVE_TROCR:
            return {
                "status": "error",
                "error": "TrOCR not installed. Install transformers and torch.",
                "ocr_text": "",
                "text_lines": []
            }
        
        logger.info("Using TrOCR for HANDWRITTEN text...")
        
        # Import the existing handwritten OCR module
        from app.services.handwritten_prescription_ocr import HandwrittenPrescriptionOCR
        return HandwrittenPrescriptionOCR.process_prescription_image(image_path)
    
    @staticmethod
    def _preprocess_for_tesseract(image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better Tesseract accuracy on printed prescriptions.
        """
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # Increase contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        # Binarize
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary
    
    @staticmethod
    def process_from_bytes(image_bytes: bytes, filename: str = "prescription.jpg") -> Dict[str, Any]:
        """Process prescription from image bytes."""
        temp_file_path = None
        
        try:
            # Save bytes to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as tmp:
                tmp.write(image_bytes)
                temp_file_path = tmp.name
            
            # Process
            result = HybridPrescriptionOCR.process_prescription(temp_file_path)
            result['uploaded_file'] = filename
            
            return result
            
        finally:
            # Cleanup
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
