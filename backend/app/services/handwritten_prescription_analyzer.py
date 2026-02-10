"""
Handwritten Prescription Analyzer - Complete Hybrid Implementation
Combines CNN Preprocessing + Multi-Method OCR + LLM Parsing
Supports both Ollama and Azure OpenAI providers
"""

import cv2
import numpy as np
import json
import logging
import os
import requests
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from app.services.handwritten_prescription_preprocessor import HandwrittenPrescriptionPreprocessor
from app.services.multimethod_ocr import MultiMethodHandwrittenOCR

logger = logging.getLogger(__name__)


class HybridHandwrittenPrescriptionAnalyzer:
    """
    Complete analyzer for handwritten prescriptions using:
    - CNN-based image preprocessing
    - Multi-method OCR (EasyOCR + Tesseract + PaddleOCR)
    - LLM parsing for structured extraction (Ollama or Azure OpenAI)
    - Medical validation
    """

    def __init__(self, ollama_url: str = 'http://localhost:11434', ollama_model: str = 'phi4'):
        """
        Initialize the analyzer
        
        Args:
            ollama_url: URL for Ollama LLM service
            ollama_model: Ollama model to use (phi4, llama2, etc.)
        """
        self.logger = logger
        self.ollama_url = ollama_url
        self.ollama_model = ollama_model

        # Initialize components
        self.preprocessor = HandwrittenPrescriptionPreprocessor()
        self.ocr = MultiMethodHandwrittenOCR(languages=['en'])

        self.logger.info("✅ Hybrid Handwritten Prescription Analyzer initialized")

    def analyze_prescription(self, image_path: str) -> Dict[str, Any]:
        """
        Complete analysis pipeline:
        1. CNN Preprocessing
        2. Multi-Method OCR
        3. LLM Parsing
        4. Medical Validation
        
        Args:
            image_path: Path to prescription image
            
        Returns:
            Complete structured analysis result
        """
        self.logger.info(f"🏥 Starting prescription analysis: {image_path}")

        try:
            # Step 1: Preprocess image with CNN techniques
            self.logger.info("STAGE 1: Image Preprocessing (CNN)")
            preprocessed = self.preprocessor.preprocess_for_ocr(image_path)
            quality_score = self.preprocessor.get_image_quality_score(cv2.imread(image_path))
            self.logger.info(f"  Quality score: {quality_score:.2%}")

            # Step 2: Multi-method OCR extraction
            self.logger.info("STAGE 2: Multi-Method OCR Extraction")
            ocr_result = self.ocr.extract_text_multimethod(preprocessed)
            self.logger.info(f"  Methods used: {', '.join(ocr_result['methods_used'])}")
            self.logger.info(f"  Confidence: {ocr_result['confidence']:.2%}")
            self.logger.info(f"  Quality score: {ocr_result['quality_score']:.2%}")

            extracted_text = ocr_result['text']
            
            # LOG EXTRACTED TEXT FOR USER CONFIRMATION
            self.logger.info("=" * 80)
            self.logger.info("📄 EXTRACTED TEXT FROM PRESCRIPTION (Raw OCR Output):")
            self.logger.info("=" * 80)
            if extracted_text and len(extracted_text.strip()) > 0:
                self.logger.info(f"\n{extracted_text}\n")
                self.logger.info(f"📊 Text length: {len(extracted_text)} characters")
                self.logger.info(f"📊 Word count: {len(extracted_text.split())} words")
                self.logger.info(f"📊 Line count: {len(extracted_text.splitlines())} lines")
            else:
                self.logger.warning("⚠️ NO TEXT EXTRACTED - OCR returned empty string!")
            self.logger.info("=" * 80)

            # Validate OCR output
            ocr_validation = self.ocr.validate_extracted_text(extracted_text)
            self.logger.info(f"  OCR Validation: {ocr_validation}")

            if not ocr_validation['has_content']:
                return {
                    'status': 'error',
                    'message': 'No text detected in image. Please check image quality.',
                    'stage': 'OCR',
                    'error': 'Empty OCR result',
                    'extracted_text': extracted_text
                }

            # Step 3: Parse with LLM
            self.logger.info("STAGE 3: LLM Parsing & Extraction")
            self.logger.info("🔄 Sending extracted text to LLM for structured parsing...")
            parsed_data = self._parse_with_llm(extracted_text)

            if not parsed_data or 'error' in parsed_data:
                self.logger.warning("⚠️ LLM parsing failed, attempting regex fallback")
                parsed_data = self._extract_with_regex(extracted_text)
                self.logger.info("✅ Regex fallback completed")

            # Step 4: Medical validation
            self.logger.info("STAGE 4: Medical Validation")
            validated_data = self._validate_medical_data(parsed_data)

            # Generate final report
            report = self._generate_report(
                image_path,
                extracted_text,
                parsed_data,
                validated_data,
                ocr_result,
                quality_score
            )

            self.logger.info("✅ Prescription analysis complete")
            return report

        except Exception as e:
            self.logger.error(f"❌ Analysis failed: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Prescription analysis failed: {str(e)}',
                'error': str(e)
            }

    def _parse_with_llm(self, extracted_text: str) -> Dict[str, Any]:
        """
        Parse prescription using LLM (Phi-4 via Ollama)
        
        Args:
            extracted_text: Raw text from OCR
            
        Returns:
            Structured prescription data
        """
        prompt = f"""
        You are a medical prescription analyzer. Extract information from this handwritten prescription text.
        
        Text from prescription:
        ```
        {extracted_text}
        ```
        
        Extract and structure the following information:
        1. Patient name
        2. Patient age (if mentioned)
        3. Doctor name
        4. Doctor qualification (if mentioned)
        5. Date of prescription
        6. Chief complaint / Diagnosis
        7. Medicines with:
           - Medicine name
           - Dosage (with units: mg, ml, tabs, etc.)
           - Frequency (OD, BD, TDS, QID, etc. or "once daily", "twice daily", etc.)
           - Duration (e.g., 7 days, 2 weeks)
           - Timing (morning, evening, with food, etc.)
           - Special instructions
        8. Medical advice / Follow-up instructions
        9. Allergies (if mentioned)
        10. Contraindications (if mentioned)
        
        Return ONLY valid JSON (no markdown, no code blocks) with this structure:
        {{
            "patient_details": {{
                "name": "...",
                "age": "...",
                "gender": "..."
            }},
            "doctor_details": {{
                "name": "...",
                "qualification": "..."
            }},
            "prescription_date": "...",
            "chief_complaint": "...",
            "diagnosis": "...",
            "medicines": [
                {{
                    "name": "...",
                    "dosage": "...",
                    "frequency": "...",
                    "duration": "...",
                    "timing": "...",
                    "instructions": "..."
                }}
            ],
            "medical_advice": "...",
            "allergies": "...",
            "contraindications": "..."
        }}
        
        If any field is not found, use null. Be thorough in extracting medicine information.
        """

        provider = os.getenv("LLM_PROVIDER", "ollama").lower().strip()
        self.logger.info(f"🔧 Handwritten Prescription Analyzer using LLM provider: {provider}")

        try:
            if provider == "azure_openai":
                # Azure OpenAI implementation
                azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
                azure_api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
                azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "Sanjeevani-Phi-4").strip()
                
                if not azure_endpoint or not azure_api_key:
                    self.logger.error("Azure OpenAI credentials missing")
                    return None
                
                base_endpoint = azure_endpoint.replace("/openai/v1/", "").rstrip("/")
                api_url = f"{base_endpoint}/openai/deployments/{azure_deployment}/chat/completions?api-version=2024-02-15-preview"
                
                response = requests.post(
                    api_url,
                    json={
                        "messages": [
                            {"role": "system", "content": "You are a medical AI assistant that extracts prescription information. Respond only with valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2048,
                    },
                    headers={
                        "Content-Type": "application/json",
                        "api-key": azure_api_key
                    },
                    timeout=120
                )

                if response.status_code != 200:
                    self.logger.error(f"Azure OpenAI API error: {response.status_code}")
                    return None

                result = response.json()
                text_response = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            else:  # ollama provider
                response = requests.post(
                    f'{self.ollama_url}/api/generate',
                    json={
                        'model': self.ollama_model,
                        'prompt': prompt,
                        'stream': False,
                        'temperature': 0.3  # Low temperature for precise extraction
                    },
                    timeout=120
                )

                if response.status_code != 200:
                    self.logger.error(f"LLM API error: {response.status_code}")
                    return None

                result = response.json()
                text_response = result.get('response', '')

            # Extract JSON from response
            try:
                # Find JSON in response
                json_start = text_response.find('{')
                json_end = text_response.rfind('}') + 1

                if json_start >= 0 and json_end > json_start:
                    json_str = text_response[json_start:json_end]
                    parsed = json.loads(json_str)
                    self.logger.info("✅ LLM parsing successful")
                    return parsed
                else:
                    self.logger.warning("No JSON found in LLM response")
                    return None

            except json.JSONDecodeError as je:
                self.logger.error(f"JSON decode error: {je}")
                return None

        except requests.exceptions.Timeout:
            self.logger.error("LLM request timeout (120s)")
            return None
        except Exception as e:
            self.logger.error(f"LLM parsing error: {e}")
            return None

    def _extract_with_regex(self, text: str) -> Dict[str, Any]:
        """
        Fallback regex-based extraction if LLM fails
        
        Args:
            text: Raw OCR text
            
        Returns:
            Extracted data using regex patterns
        """
        import re

        self.logger.info("Using regex fallback extraction")

        # Extract medicines (pattern: text with dosage units)
        medicine_patterns = [
            r'([A-Za-z0-9\s\-]+?)\s+(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|%)',
            r'([A-Za-z0-9\s\-]+?)\s+(\d+)\s*(tablet|capsule|drop|vial)',
        ]

        medicines = []
        for pattern in medicine_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                medicines.append({
                    'name': match.group(1).strip(),
                    'dosage': f"{match.group(2)} {match.group(3)}",
                    'frequency': 'Not specified',
                    'duration': 'Not specified'
                })

        return {
            'patient_details': {'name': 'Not specified'},
            'doctor_details': {'name': 'Not specified'},
            'medicines': medicines,
            'medical_advice': 'Not specified',
            'extracted_with': 'regex_fallback'
        }

    def _validate_medical_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate medical data against safety rules
        
        Args:
            parsed_data: Parsed prescription data
            
        Returns:
            Validation results with warnings
        """
        validation = {
            'valid': True,
            'warnings': [],
            'errors': []
        }

        # Check if medicines list exists
        medicines = parsed_data.get('medicines', [])
        if not medicines:
            validation['warnings'].append('No medicines found in prescription')

        # Check each medicine
        for med in medicines:
            name = med.get('name', '').lower()
            dosage = med.get('dosage', '')

            # Warning for common antibiotics without proper frequency
            if any(ab in name for ab in ['pen', 'amox', 'cipro', 'azith']):
                if not med.get('frequency'):
                    validation['warnings'].append(f"Antibiotic '{name}' missing frequency")

        # Check patient details
        if not parsed_data.get('patient_details', {}).get('name'):
            validation['warnings'].append('Patient name not found')

        return validation

    def _generate_report(self, image_path: str, extracted_text: str, parsed_data: Dict,
                        validated_data: Dict, ocr_result: Dict, quality_score: float) -> Dict[str, Any]:
        """
        Generate comprehensive prescription report
        
        Args:
            image_path: Path to prescription image
            extracted_text: Raw extracted text
            parsed_data: Structured parsed data
            validated_data: Validation results
            ocr_result: OCR details
            quality_score: Image quality score
            
        Returns:
            Complete prescription report
        """
        report = {
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'image': Path(image_path).name,
            'image_quality': {
                'score': quality_score,
                'rating': 'High' if quality_score > 0.7 else 'Medium' if quality_score > 0.4 else 'Low'
            },
            'ocr_analysis': {
                'methods_used': ocr_result['methods_used'],
                'confidence': ocr_result['confidence'],
                'quality_score': ocr_result['quality_score'],
                'extracted_text': extracted_text[:500]  # First 500 chars
            },
            'prescription': {
                'patient_details': parsed_data.get('patient_details', {}),
                'doctor_details': parsed_data.get('doctor_details', {}),
                'date': parsed_data.get('prescription_date'),
                'diagnosis': parsed_data.get('diagnosis'),
                'medicines': parsed_data.get('medicines', []),
                'medical_advice': parsed_data.get('medical_advice'),
                'allergies': parsed_data.get('allergies'),
            },
            'validation': validated_data,
            'structured_data': parsed_data,
            'recommendations': [
                '⚠️ Always verify prescription with original source',
                '⚠️ Consult pharmacist about medicine interactions',
                '⚠️ Follow doctor\'s instructions strictly',
                '⚠️ Report any allergic reactions immediately'
            ]
        }

        return report

    def analyze_from_bytes(self, image_bytes: bytes, filename: str = 'prescription.jpg') -> Dict[str, Any]:
        """
        Analyze prescription from image bytes (for API uploads)
        
        Args:
            image_bytes: Image file content
            filename: Original filename
            
        Returns:
            Analysis result
        """
        import tempfile
        import os

        temp_path = None
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                tmp.write(image_bytes)
                temp_path = tmp.name

            # Analyze
            result = self.analyze_prescription(temp_path)
            result['uploaded_file'] = filename

            return result

        except Exception as e:
            self.logger.error(f"Error processing bytes: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'uploaded_file': filename
            }
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass


# ============================================================================
# Static Wrapper Class for API Compatibility
# ============================================================================

class HandwrittenPrescriptionAnalyzer:
    """
    Static wrapper class for API compatibility.
    Provides static methods that internally create analyzer instances.
    """
    
    @staticmethod
    def analyze_handwritten_prescription_from_bytes(image_bytes: bytes, filename: str = 'prescription.jpg') -> Dict[str, Any]:
        """
        Static method to analyze prescription from bytes.
        Creates analyzer instance and processes the image.
        
        Args:
            image_bytes: Image file content
            filename: Original filename
            
        Returns:
            Analysis result dictionary
        """
        try:
            # Get configuration from environment
            ollama_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
            ollama_model = os.getenv('OLLAMA_MODEL', 'phi4')
            
            # Create analyzer instance
            analyzer = HybridHandwrittenPrescriptionAnalyzer(
                ollama_url=ollama_url,
                ollama_model=ollama_model
            )
            
            # Analyze from bytes
            return analyzer.analyze_from_bytes(image_bytes, filename)
            
        except Exception as e:
            logger.error(f"❌ Static analysis failed: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Prescription analysis failed: {str(e)}',
                'error': str(e),
                'uploaded_file': filename
            }
    
    @staticmethod
    def get_service_info() -> Dict[str, Any]:
        """
        Get service information and capabilities.
        
        Returns:
            Service information dictionary
        """
        provider = os.getenv("LLM_PROVIDER", "ollama").lower().strip()
        
        return {
            'service': 'Handwritten Prescription Analyzer',
            'version': '2.0',
            'capabilities': {
                'preprocessing': 'CNN-based image enhancement',
                'ocr': 'Multi-method (EasyOCR + Tesseract + PaddleOCR)',
                'parsing': f'LLM-based ({provider})',
                'validation': 'Medical safety checks'
            },
            'status': 'operational',
            'llm_provider': provider,
            'supported_formats': ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp']
        }

