"""
Hospital Report Analyzer Service
Specialized for analyzing typed/printed hospital reports with complete structure extraction:
- Hospital/Clinic details
- Patient information
- Doctor details
- Medicine list with dosage, duration, instructions
- Medical advice and follow-up instructions
"""

import logging
import cv2
import numpy as np
import tempfile
import os
from typing import Dict, Any, List
from PIL import Image

logger = logging.getLogger(__name__)

# Import OCR libraries
HAVE_TESSERACT = False
HAVE_EASYOCR = False

try:
    import pytesseract
    HAVE_TESSERACT = True
    logger.info("✅ Tesseract OCR available for hospital reports")
except ImportError:
    logger.warning("⚠️ pytesseract not installed")

try:
    import easyocr
    HAVE_EASYOCR = True
    logger.info("✅ EasyOCR available for hospital reports")
except ImportError:
    logger.warning("⚠️ EasyOCR not installed")


class HospitalReportAnalyzer:
    """
    Complete pipeline for analyzing typed hospital reports.
    Extracts structured information including hospital details, patient info, medicines, and advice.
    """
    
    _easyocr_reader = None
    
    @staticmethod
    def analyze_hospital_report(image_path: str) -> Dict[str, Any]:
        """
        Complete analysis pipeline for hospital reports.
        
        Args:
            image_path: Path to hospital report image
            
        Returns:
            Dictionary with structured report information
        """
        logger.info(f"🏥 Starting hospital report analysis for: {image_path}")
        
        try:
            # STEP 1: Extract text using OCR (optimized for printed text)
            logger.info("📝 STEP 1: Extracting text from hospital report...")
            ocr_result = HospitalReportAnalyzer._extract_text_from_report(image_path)
            
            if ocr_result["status"] != "success":
                logger.warning(f"⚠️ OCR failed: {ocr_result.get('error')}")
                return {
                    "status": "error",
                    "message": "Failed to extract text from hospital report",
                    "error": ocr_result.get("error"),
                    "extracted_text": "",
                    "structured_data": {}
                }
            
            extracted_text = ocr_result.get("ocr_text", "")
            logger.info(f"✅ Extracted {len(extracted_text)} characters")
            logger.info(f"📄 EXTRACTED TEXT PREVIEW:\n{extracted_text[:500]}")
            
            if len(extracted_text.strip()) < 20:
                logger.warning("⚠️ Insufficient text extracted")
                return {
                    "status": "warning",
                    "message": "Could not extract sufficient text from report",
                    "extracted_text": extracted_text,
                    "structured_data": {}
                }
            
            # STEP 2: Parse structured data using LLM
            logger.info("🧠 STEP 2: Parsing structured data with LLM...")
            from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator
            
            parsed_data = HospitalReportAnalyzer._parse_report_with_llm(extracted_text)
            
            logger.info("✅ Hospital report analysis complete")
            
            return {
                "status": "success",
                "message": "Hospital report analyzed successfully",
                "extracted_text": extracted_text,
                "structured_data": parsed_data,
                "ocr_method": ocr_result.get("method", "Unknown"),
                "warnings": [
                    "This analysis is AI-assisted and should be verified with the original report",
                    "Always consult with the prescribing doctor for clarifications",
                    "Verify all medicine names, dosages, and instructions before use"
                ]
            }
            
        except Exception as e:
            logger.error(f"❌ Hospital report analysis failed: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to analyze hospital report",
                "extracted_text": "",
                "structured_data": {}
            }
    
    @staticmethod
    def _extract_text_from_report(image_path: str) -> Dict[str, Any]:
        """
        Extract text from hospital report using best available OCR.
        Enhanced for structured documents with proper layout preservation.
        Uses BOTH Tesseract and EasyOCR, merges results intelligently.
        """
        try:
            # Load original image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image from {image_path}")
            
            logger.info(f"📸 Image loaded: {image.shape[1]}x{image.shape[0]} pixels")
            
            all_results = []
            
            # METHOD 1: Try EasyOCR first (better for real-world images with varied layouts)
            if HAVE_EASYOCR:
                try:
                    logger.info("🔍 METHOD 1: EasyOCR (layout-aware extraction)...")
                    
                    if HospitalReportAnalyzer._easyocr_reader is None:
                        logger.info("  📍 Initializing EasyOCR reader...")
                        HospitalReportAnalyzer._easyocr_reader = easyocr.Reader(['en'], gpu=False)
                    
                    # Run EasyOCR with paragraph detection enabled
                    result = HospitalReportAnalyzer._easyocr_reader.readtext(
                        image,
                        paragraph=False,  # Get individual text segments for better control
                        detail=1
                    )
                    
                    # Sort by vertical position first (top to bottom), then horizontal (left to right)
                    # This preserves the reading order of structured documents
                    sorted_result = sorted(result, key=lambda x: (int(x[0][0][1] / 30), x[0][0][0]))
                    
                    # Group text by lines (same vertical position = same line)
                    lines = []
                    current_line = []
                    current_y = -1
                    line_threshold = 30  # pixels - texts within this range are on same line
                    
                    for (bbox, text, conf) in sorted_result:
                        if conf > 0.15 and text.strip():  # Lower threshold to catch more text
                            y_pos = int(bbox[0][1])
                            
                            # Check if this is on the same line as previous text
                            if current_y == -1 or abs(y_pos - current_y) < line_threshold:
                                current_line.append(text.strip())
                                current_y = y_pos if current_y == -1 else current_y
                            else:
                                # New line detected
                                if current_line:
                                    lines.append(' '.join(current_line))
                                current_line = [text.strip()]
                                current_y = y_pos
                    
                    # Add last line
                    if current_line:
                        lines.append(' '.join(current_line))
                    
                    full_text = '\n'.join(lines)
                    
                    if full_text and len(full_text.strip()) > 20:
                        word_count = len([w for w in full_text.split() if len(w) > 2])
                        logger.info(f"  ✅ EasyOCR: {len(full_text)} chars, {len(lines)} lines, {word_count} words")
                        all_results.append(("EasyOCR-Structured", full_text, len(full_text), word_count))
                    else:
                        logger.warning(f"  ⚠️ EasyOCR: Only {len(full_text)} chars")
                        
                except Exception as e:
                    logger.warning(f"  ❌ EasyOCR failed: {e}")
            
            # METHOD 2: Try Tesseract with multiple PSM modes on preprocessed image
            preprocessed = HospitalReportAnalyzer._preprocess_for_ocr(image)
            
            if HAVE_TESSERACT:
                try:
                    logger.info("🔍 METHOD 2: Tesseract OCR (multiple segmentation modes)...")
                    
                    best_text = ""
                    best_length = 0
                    best_words = 0
                    best_mode = ""
                    
                    # Try different PSM modes - each works better for different layouts
                    psm_modes = [
                        (3, "fully automatic page segmentation"),
                        (6, "uniform block of text"),
                        (4, "single column of text"),
                        (11, "sparse text - no OSD")
                    ]
                    
                    for psm, description in psm_modes:
                        try:
                            # Use higher OEM (LSTM engine) for better accuracy
                            custom_config = f'--oem 1 --psm {psm}'
                            text = pytesseract.image_to_string(
                                preprocessed, 
                                lang='eng',
                                config=custom_config
                            )
                            
                            words = len([w for w in text.split() if len(w) > 2])
                            
                            if len(text.strip()) > best_length:
                                best_text = text
                                best_length = len(text.strip())
                                best_words = words
                                best_mode = f"PSM {psm}"
                                logger.info(f"  ✓ PSM {psm} ({description}): {len(text)} chars, {words} words")
                        except Exception as e:
                            logger.debug(f"  ✗ PSM {psm} failed: {e}")
                            continue
                    
                    if best_text and len(best_text.strip()) > 20:
                        logger.info(f"  ✅ Best Tesseract mode: {best_mode}")
                        all_results.append((f"Tesseract-{best_mode}", best_text, len(best_text.strip()), best_words))
                        
                except Exception as e:
                    logger.warning(f"  ❌ Tesseract preprocessed failed: {e}")
            
            # METHOD 3: Try Tesseract on original grayscale (sometimes works better than preprocessed)
            if HAVE_TESSERACT:
                try:
                    logger.info("🔍 METHOD 3: Tesseract on original grayscale...")
                    
                    # Convert to grayscale only
                    if len(image.shape) == 3:
                        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                    else:
                        gray = image
                    
                    # Try with automatic page segmentation
                    text = pytesseract.image_to_string(gray, lang='eng', config='--oem 1 --psm 3')
                    words = len([w for w in text.split() if len(w) > 2])
                    
                    if text and len(text.strip()) > 20:
                        logger.info(f"  ✅ Tesseract-Original: {len(text)} chars, {words} words")
                        all_results.append(("Tesseract-Original-Gray", text, len(text.strip()), words))
                        
                except Exception as e:
                    logger.warning(f"  ❌ Tesseract original failed: {e}")
            
            # INTELLIGENT MERGING: Pick the best result and enhance with unique content from others
            if all_results:
                # Score each result by: (length * 0.4) + (word_count * 15)
                # This favors results with more meaningful words over just length
                scored_results = []
                for method, text, length, word_count in all_results:
                    score = (length * 0.4) + (word_count * 15)
                    scored_results.append((score, method, text, length, word_count))
                    logger.info(f"  📊 {method}: {length} chars, {word_count} words, score={score:.1f}")
                
                # Pick best score as base
                scored_results.sort(reverse=True)
                best_score, best_method, best_text, best_length, best_words = scored_results[0]
                
                logger.info(f"✅ PRIMARY RESULT: {best_method} ({best_length} chars, {best_words} words)")
                
                # Enhance with unique lines from other methods
                base_lines = set(line.strip().lower() for line in best_text.split('\n') if line.strip())
                enhanced_text = best_text
                added_lines = 0
                
                for score, method, text, length, word_count in scored_results[1:]:
                    other_lines = [line for line in text.split('\n') if line.strip()]
                    
                    for line in other_lines:
                        line_clean = line.strip()
                        line_lower = line_clean.lower()
                        
                        # Add line if it's unique and substantial
                        if (line_lower not in base_lines and 
                            len(line_clean) > 5 and 
                            len([w for w in line_clean.split() if len(w) > 2]) > 0):
                            enhanced_text += '\n' + line_clean
                            base_lines.add(line_lower)
                            added_lines += 1
                
                if added_lines > 0:
                    logger.info(f"  📍 Enhanced with {added_lines} unique lines from other OCR methods")
                
                return {
                    "status": "success",
                    "ocr_text": enhanced_text.strip(),
                    "method": f"{best_method} (enhanced with {len(scored_results)-1} other method(s))",
                    "extraction_stats": {
                        "total_chars": len(enhanced_text),
                        "total_words": len([w for w in enhanced_text.split() if len(w) > 2]),
                        "total_lines": len([l for l in enhanced_text.split('\n') if l.strip()]),
                        "methods_used": len(all_results),
                        "lines_added": added_lines
                    }
                }
            
            # No OCR worked
            return {
                "status": "error",
                "error": "No OCR engine could extract text. Image may be too unclear.",
                "ocr_text": ""
            }
            
        except Exception as e:
            logger.error(f"❌ Text extraction failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "ocr_text": ""
            }
    
    @staticmethod
    def _preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
        """
        Preprocess hospital report image for optimal OCR accuracy.
        Uses advanced preprocessing for maximum text extraction quality.
        """
        from app.services.advanced_ocr_preprocessor import AdvancedOCRPreprocessor
        return AdvancedOCRPreprocessor.preprocess_for_printed_text(image)
    
    @staticmethod
    def _parse_report_with_llm(extracted_text: str) -> Dict[str, Any]:
        """
        Parse hospital report text into structured format using LLM.
        Extracts: hospital details, patient info, doctor info, medicines, advice.
        Uses enhanced parsing with maximum accuracy focus (80%+ target).
        """
        logger.info("🧠 Parsing hospital report with LLM (HIGH ACCURACY MODE)...")
        
        from app.services.medical_document_parser import MedicalDocumentParser
        
        # Use high-accuracy parser with longer timeout
        parsed_data = MedicalDocumentParser.parse_hospital_report_accurate(
            extracted_text,
            max_retries=5,
            timeout=120  # 2 minutes for accurate parsing
        )
        
        return parsed_data
    
    @staticmethod
    def _create_empty_structure() -> Dict[str, Any]:
        """Create empty structure when parsing fails."""
        return {
            "hospital_details": {},
            "patient_details": {},
            "doctor_details": {},
            "visit_details": {},
            "medicines": [],
            "investigations": [],
            "medical_advice": {},
            "additional_notes": "Failed to parse report structure"
        }
    
    @staticmethod
    def analyze_from_bytes(image_bytes: bytes, filename: str = "hospital_report.jpg") -> Dict[str, Any]:
        """
        Analyze hospital report from image bytes (for API uploads).
        
        Args:
            image_bytes: Image file content as bytes
            filename: Original filename
            
        Returns:
            Dictionary with analysis results
        """
        logger.info(f"📥 Received hospital report for analysis: {filename}")
        
        temp_file_path = None
        
        try:
            # Save bytes to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as tmp:
                tmp.write(image_bytes)
                temp_file_path = tmp.name
            
            logger.debug(f"Temporary file created: {temp_file_path}")
            
            # Verify it's a valid image
            image = cv2.imread(temp_file_path)
            if image is None:
                raise ValueError("Invalid image file")
            
            # Run analysis
            result = HospitalReportAnalyzer.analyze_hospital_report(temp_file_path)
            result['uploaded_file'] = filename
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing hospital report bytes: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to process hospital report image",
                "extracted_text": "",
                "structured_data": {}
            }
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    logger.debug(f"Temporary file cleaned up: {temp_file_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up temporary file: {cleanup_error}")
    
    @staticmethod
    def get_service_info() -> Dict[str, Any]:
        """Get information about the hospital report analysis service."""
        return {
            "service_name": "Hospital Report Analyzer",
            "description": "Complete structured analysis of typed/printed hospital reports",
            "features": [
                "Extract hospital and clinic details",
                "Extract patient information",
                "Extract doctor details and credentials",
                "Parse complete medicine list with dosage, frequency, duration",
                "Extract investigations and test results",
                "Parse medical advice and follow-up instructions"
            ],
            "ocr_engines": {
                "primary": "Tesseract (optimized for structured documents)",
                "fallback": "EasyOCR (multilingual support)"
            },
            "parsing": {
                "method": "LLM-based structured extraction",
                "model": "Phi-4 via Ollama",
                "capability": "Extract and structure complete hospital report data"
            },
            "supported_formats": ["jpg", "jpeg", "png", "pdf"],
            "output_structure": {
                "hospital_details": "Hospital name, address, contact",
                "patient_details": "Name, ID, age, gender, contact",
                "doctor_details": "Name, specialization, registration",
                "visit_details": "Date, type, diagnosis",
                "medicines": "Complete medicine list with all details",
                "investigations": "Tests and results",
                "medical_advice": "Diet, lifestyle, precautions, follow-up"
            }
        }
