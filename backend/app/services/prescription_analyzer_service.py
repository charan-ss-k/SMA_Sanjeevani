"""
Prescription Analysis Service
Orchestrates the complete workflow: Image Preprocessing -> HTR -> LLM Deciphering
"""

import logging
import os
import tempfile
from typing import Dict, Any, Optional
import cv2
import numpy as np

from app.services.prescription_image_preprocessor import PrescriptionImagePreprocessor
from app.services.htr_service import HTRService
from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator

logger = logging.getLogger(__name__)


class PrescriptionAnalyzerService:
    """
    Complete workflow for analyzing handwritten prescriptions from images.
    
    Process:
    1. Preprocess image (adaptive thresholding, denoising, morphology)
    2. Recognize handwritten text using TrOCR
    3. Decipher messy text using specialized LLM prompt
    4. Return structured medicine list with dosages and frequencies
    """
    
    @staticmethod
    def analyze_prescription_image(image_path: str) -> Dict[str, Any]:
        """
        Complete prescription analysis workflow.
        
        Args:
            image_path: Path to prescription image file
            
        Returns:
            Dictionary with medicines list, dosages, frequencies, and metadata
        """
        logger.info(f"🏥 Starting prescription analysis for: {image_path}")
        
        try:
            # Step 1: Preprocess image for handwritten text
            logger.info("📸 Step 1: Preprocessing prescription image...")
            preprocessed_image = PrescriptionImagePreprocessor.preprocess(image_path)
            logger.info("✅ Image preprocessing complete")
            
            # Step 2: Recognize handwritten text using TrOCR
            logger.info("👁️  Step 2: Recognizing handwritten text (HTR)...")
            ocr_text = HTRService.recognize_text(preprocessed_image)
            logger.info(f"✅ Text recognized. Extracted: {len(ocr_text)} characters")
            logger.debug(f"OCR Output: {ocr_text[:300]}...")
            
            if not ocr_text or len(ocr_text.strip()) < 3:
                logger.warning("⚠️ OCR produced minimal text. Prescription may be unclear.")
                return {
                    "status": "warning",
                    "message": "Could not recognize text from prescription. Please ensure the image is clear and legible.",
                    "ocr_text": ocr_text,
                    "medicines": [],
                    "error": "Insufficient text recognized"
                }
            
            # Step 3: Decipher messy text using specialized LLM prompt
            logger.info("🧠 Step 3: Deciphering prescription with LLM...")
                deciphered = EnhancedMedicineLLMGenerator.decipher_prescription_text(ocr_text)

                if deciphered.get("status") == "error":
                    logger.error(f"❌ LLM deciphering failed: {deciphered.get('error')}")
                    return {
                        "status": "partial",
                        "message": "OCR succeeded but LLM deciphering failed",
                        "pipeline": {
                            "preprocessing": "✅ Complete",
                            "htr": "✅ Complete",
                            "llm_deciphering": "❌ Failed"
                        },
                        "ocr_text": ocr_text,
                        "medicines": [],
                        "raw_llm_output": deciphered.get("llm_output", ""),
                        "generated_at": deciphered.get("generated_at", ""),
                        "llm_error": deciphered.get("error"),
                        "warnings": [
                            "LLM service is unavailable or failed to respond",
                            "Please verify the prescription manually"
                        ]
                    }

                logger.info(f"✅ Deciphering complete. Found {len(deciphered.get('medicines', []))} medicines")
            
            # Combine all results
            result = {
                "status": "success",
                "pipeline": {
                    "preprocessing": "✅ Complete",
                    "htr": "✅ Complete",
                    "llm_deciphering": "✅ Complete"
                },
                "ocr_text": ocr_text,
                "medicines": deciphered.get('medicines', []),
                "raw_llm_output": deciphered.get('llm_output', ''),
                "generated_at": deciphered.get('generated_at', ''),
                "warnings": [
                    "This analysis is AI-assisted and should be verified with the original prescription",
                    "Always consult a healthcare professional before taking any medicines",
                    "Dosages and frequencies should be confirmed with your doctor or pharmacist"
                ]
            }
            
            logger.info(f"🎉 Prescription analysis successful. Found {len(result['medicines'])} medicines")
            return result
            
        except ValueError as ve:
            logger.error(f"❌ Validation error: {ve}")
            return {
                "status": "error",
                "error": f"Invalid image or preprocessing error: {str(ve)}",
                "medicines": []
            }
        except RuntimeError as re:
            logger.error(f"❌ Runtime error: {re}")
            return {
                "status": "error",
                "error": f"Text recognition error: {str(re)}",
                "medicines": []
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error during prescription analysis: {e}")
            return {
                "status": "error",
                "error": f"Prescription analysis failed: {str(e)}",
                "medicines": [],
                "traceback": str(e)
            }
    
    @staticmethod
    def analyze_prescription_from_bytes(image_bytes: bytes, filename: str = "prescription.jpg") -> Dict[str, Any]:
        """
        Analyze prescription from image bytes (for API uploads).
        
        Args:
            image_bytes: Image file content as bytes
            filename: Original filename (for validation)
            
        Returns:
            Dictionary with analysis results
        """
        logger.info(f"📥 Received prescription image for analysis: {filename}")
        
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
                raise ValueError("Invalid image file. Please upload a valid image (JPG, PNG, etc.)")
            
            logger.debug(f"Image validated. Size: {image.shape}")
            
            # Run analysis
            result = PrescriptionAnalyzerService.analyze_prescription_image(temp_file_path)
            
            # Add filename to result
            result['uploaded_file'] = filename
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing prescription bytes: {e}")
            return {
                "status": "error",
                "error": f"Failed to process prescription image: {str(e)}",
                "medicines": []
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
        """Get information about the prescription analysis service."""
        return {
            "service_name": "Prescription Analysis Service",
            "description": "Analyzes handwritten prescription images using AI",
            "pipeline": {
                "step_1": {
                    "name": "Image Preprocessing",
                    "module": "PrescriptionImagePreprocessor",
                    "techniques": [
                        "Grayscale conversion",
                        "Bilateral filtering (denoising)",
                        "Adaptive thresholding",
                        "Morphological operations",
                        "Deskewing"
                    ]
                },
                "step_2": {
                    "name": "Handwritten Text Recognition (HTR)",
                    "module": "HTRService",
                    "model": "microsoft/trocr-base-handwritten",
                    "framework": "Transformers + PyTorch"
                },
                "step_3": {
                    "name": "Prescription Deciphering",
                    "module": "EnhancedMedicineLLMGenerator",
                    "model": "Phi-4 (via Ollama)",
                    "capability": "Decipher noisy handwritten prescription text"
                }
            },
            "supported_formats": ["jpg", "jpeg", "png", "webp", "bmp", "tiff"],
            "max_file_size_mb": 10,
            "output_format": {
                "medicines": [
                    {
                        "medicine_name": "str - Name of the medicine",
                        "dosage": "str - Amount and unit (e.g., 500mg)",
                        "frequency": "str - How many times per day",
                        "duration": "str - How long to take",
                        "special_instructions": "str - Any special instructions",
                        "confidence": "str - high/medium/low",
                        "notes": "str - Any uncertainty or alternatives"
                    }
                ]
            }
        }
