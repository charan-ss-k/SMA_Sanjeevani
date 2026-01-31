"""
Integration module for Handwritten Prescription OCR
Connects the handwritten prescription OCR service with prescription analysis and LLM deciphering
"""

import logging
from typing import Dict, Any

from app.services.handwritten_prescription_ocr import HandwrittenPrescriptionOCR
from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator

logger = logging.getLogger(__name__)


class HandwrittenPrescriptionAnalyzer:
    """
    Complete workflow for analyzing handwritten prescriptions:
    1. Extract text using proper line-based TrOCR OCR
    2. Decipher with LLM for accurate medicine extraction
    3. Return structured medicine list
    """
    
    @staticmethod
    def analyze_handwritten_prescription(image_path: str) -> Dict[str, Any]:
        """
        Complete analysis pipeline for handwritten prescriptions.
        
        Args:
            image_path: Path to prescription image
            
        Returns:
            Dictionary with medicines list, dosages, and metadata
        """
        logger.info(f"🏥 Starting handwritten prescription analysis for: {image_path}")
        
        try:
            # PHASE 1: Extract text using proper line-based OCR
            logger.info("📝 PHASE 1: Extracting text with line-based TrOCR...")
            ocr_result = HandwrittenPrescriptionOCR.process_prescription_image(image_path)
            
            if ocr_result["status"] != "success":
                logger.warning(f"⚠️ OCR phase resulted in: {ocr_result['status']}")
                return {
                    "status": ocr_result["status"],
                    "message": ocr_result.get("message", "OCR failed"),
                    "ocr_result": ocr_result,
                    "medicines": [],
                    "error": ocr_result.get("error")
                }
            
            ocr_text = ocr_result.get("ocr_text", "")
            text_lines = ocr_result.get("text_lines", [])
            
            logger.info(f"✅ OCR extracted {len(text_lines)} text lines")
            logger.debug(f"OCR Text:\n{ocr_text[:500]}...")
            
            if not ocr_text or len(ocr_text.strip()) < 5:
                logger.warning("⚠️ OCR produced minimal text")
                return {
                    "status": "warning",
                    "message": "Could not extract sufficient text from prescription. Image may be unclear.",
                    "ocr_result": ocr_result,
                    "ocr_text": ocr_text,
                    "medicines": [],
                    "error": "Insufficient text recognized"
                }
            
            # PHASE 2: Decipher with LLM
            logger.info("🧠 PHASE 2: Deciphering prescription with Enhanced Medicine LLM...")
            deciphered = EnhancedMedicineLLMGenerator.decipher_prescription_text(ocr_text)
            
            medicines = deciphered.get("medicines", [])
            logger.info(f"✅ LLM deciphering found {len(medicines)} medicines")
            
            # Combine results
            result = {
                "status": "success",
                "message": "Handwritten prescription analysis completed successfully",
                "ocr_phase": {
                    "status": "✅ Complete",
                    "text_lines_detected": len(text_lines),
                    "ocr_text": ocr_text,
                    "text_lines": text_lines
                },
                "llm_phase": {
                    "status": "✅ Complete",
                    "medicines": medicines,
                    "raw_llm_output": deciphered.get("llm_output", ""),
                    "generated_at": deciphered.get("generated_at", "")
                },
                "medicines": medicines,
                "pipeline": {
                    "text_extraction": "✅ Line-based TrOCR",
                    "text_interpretation": "✅ Enhanced Medicine LLM",
                    "medicine_extraction": "✅ Complete"
                },
                "warnings": [
                    "This analysis is AI-assisted and should be verified with the original prescription",
                    "Non-Latin scripts may not be recognized correctly",
                    "Always consult a healthcare professional before taking any medicines",
                    "Dosages and frequencies should be confirmed with your doctor or pharmacist"
                ]
            }
            
            logger.info(f"🎉 Analysis complete. Found {len(medicines)} medicines")
            return result
            
        except Exception as e:
            logger.error(f"❌ Unexpected error during prescription analysis: {e}")
            return {
                "status": "error",
                "error": f"Prescription analysis failed: {str(e)}",
                "medicines": [],
                "traceback": str(e)
            }
    
    @staticmethod
    def analyze_handwritten_prescription_from_bytes(image_bytes: bytes, filename: str = "prescription.jpg") -> Dict[str, Any]:
        """
        Analyze handwritten prescription from image bytes (for API uploads).
        
        Args:
            image_bytes: Image file content as bytes
            filename: Original filename
            
        Returns:
            Dictionary with analysis results and medicines
        """
        logger.info(f"📥 Received prescription image for analysis: {filename}")
        
        try:
            # Use OCR service to handle bytes
            ocr_result = HandwrittenPrescriptionOCR.process_prescription_from_bytes(image_bytes, filename)
            
            if ocr_result["status"] != "success":
                logger.warning(f"⚠️ OCR phase resulted in: {ocr_result['status']}")
                return {
                    "status": ocr_result["status"],
                    "message": ocr_result.get("message", "OCR failed"),
                    "ocr_result": ocr_result,
                    "medicines": [],
                    "error": ocr_result.get("error")
                }
            
            ocr_text = ocr_result.get("ocr_text", "")
            text_lines = ocr_result.get("text_lines", [])
            
            if not ocr_text or len(ocr_text.strip()) < 5:
                logger.warning("⚠️ OCR produced minimal text")
                return {
                    "status": "warning",
                    "message": "Could not extract sufficient text from prescription",
                    "ocr_result": ocr_result,
                    "ocr_text": ocr_text,
                    "medicines": [],
                    "error": "Insufficient text recognized"
                }
            
            # Decipher with LLM
            logger.info("🧠 Deciphering prescription with Enhanced Medicine LLM...")
            deciphered = EnhancedMedicineLLMGenerator.decipher_prescription_text(ocr_text)
            
            medicines = deciphered.get("medicines", [])
            logger.info(f"✅ LLM deciphering found {len(medicines)} medicines")
            
            result = {
                "status": "success",
                "message": "Handwritten prescription analysis completed successfully",
                "uploaded_file": filename,
                "ocr_phase": {
                    "status": "✅ Complete",
                    "text_lines_detected": len(text_lines),
                    "ocr_text": ocr_text,
                    "text_lines": text_lines
                },
                "llm_phase": {
                    "status": "✅ Complete",
                    "medicines": medicines,
                    "raw_llm_output": deciphered.get("llm_output", ""),
                    "generated_at": deciphered.get("generated_at", "")
                },
                "medicines": medicines,
                "warnings": [
                    "This analysis is AI-assisted and should be verified with the original prescription",
                    "Always consult a healthcare professional before taking any medicines"
                ]
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing prescription bytes: {e}")
            return {
                "status": "error",
                "error": f"Failed to analyze prescription: {str(e)}",
                "medicines": []
            }
    
    @staticmethod
    def get_service_info() -> Dict[str, Any]:
        """Get comprehensive service information."""
        ocr_info = HandwrittenPrescriptionOCR.get_service_info()
        
        return {
            "service_name": "Handwritten Prescription Analysis Service",
            "description": "Complete pipeline for analyzing handwritten prescriptions with line-based OCR and LLM deciphering",
            "phases": {
                "phase_1_ocr": ocr_info,
                "phase_2_llm": {
                    "name": "Medicine Extraction with LLM",
                    "module": "EnhancedMedicineLLMGenerator",
                    "model": "Phi-4 (via Ollama)",
                    "capability": "Extract and structure medicine information from prescription text"
                }
            },
            "output_format": {
                "medicines": [
                    {
                        "medicine_name": "str",
                        "dosage": "str",
                        "frequency": "str",
                        "duration": "str",
                        "special_instructions": "str",
                        "confidence": "high/medium/low",
                        "notes": "str"
                    }
                ]
            }
        }
