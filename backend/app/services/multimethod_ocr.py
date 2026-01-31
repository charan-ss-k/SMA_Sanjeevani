"""
Multi-Method OCR Engine for Handwritten Prescriptions
Combines EasyOCR, Tesseract v5, TrOCR, and PaddleOCR for maximum accuracy
"""

import easyocr
import pytesseract
import numpy as np
import cv2
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from PIL import Image

try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False

try:
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    import torch
    TROCR_AVAILABLE = True
except ImportError:
    TROCR_AVAILABLE = False

logger = logging.getLogger(__name__)

# Medical keywords for validation
MEDICAL_KEYWORDS = {
    'english': [
        'mg', 'ml', 'tablet', 'capsule', 'drops', 'syrup', 'injection',
        'bd', 'od', 'tds', 'qid', 'bid', 'od', 'hs', 'am', 'pm',
        'once', 'twice', 'thrice', 'daily', 'weekly', 'monthly',
        'before', 'after', 'food', 'meals', 'water', 'medicine',
        'prescription', 'doctor', 'patient', 'rx'
    ],
    'hindi': [
        'दवा', 'गोली', 'मिली', 'मिलीग्राम', 'दिन', 'बार', 'भोजन'
    ]
}


@dataclass
class OCRResult:
    """Container for OCR results from a single method"""
    method: str
    text: str
    confidence: float
    bounding_boxes: Optional[List[Any]] = None
    raw_output: Optional[Any] = None


class MultiMethodHandwrittenOCR:
    """
    Multi-method OCR combining EasyOCR, Tesseract, TrOCR, and PaddleOCR
    Uses comparison mechanism to determine most accurate result
    """
    
    def __init__(self, languages: List[str] = None):
        """
        Initialize OCR engines
        
        Args:
            languages: List of language codes to recognize (e.g., ['en', 'hi'])
        """
        self.languages = languages or ['en']
        self.logger = logger
        
        # Initialize readers
        self._easyocr_reader = None
        self._paddle_ocr = None
        self._trocr_processor = None
        self._trocr_model = None
        
        self.logger.info("🔤 Initializing Multi-Method OCR Engine (4 engines)...")
        self._initialize_easyocr()
        self._initialize_trocr()
        self._initialize_paddle_ocr()
        
    def _initialize_easyocr(self):
        """Initialize EasyOCR reader"""
        try:
            self._easyocr_reader = easyocr.Reader(self.languages, gpu=False)
            self.logger.info("✅ EasyOCR initialized successfully")
        except Exception as e:
            self.logger.warning(f"⚠️ EasyOCR initialization failed: {e}")
            self._easyocr_reader = None
    
    def _initialize_trocr(self):
        """Initialize TrOCR (Transformer-based OCR for handwriting)"""
        if not TROCR_AVAILABLE:
            self.logger.info("ℹ️ TrOCR not available - skipping initialization")
            return
        
        try:
            self.logger.info("🔄 Loading TrOCR model (handwritten)...")
            self._trocr_processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
            self._trocr_model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-handwritten')
            self.logger.info("✅ TrOCR initialized successfully")
        except Exception as e:
            self.logger.warning(f"⚠️ TrOCR initialization failed: {e}")
            self._trocr_processor = None
            self._trocr_model = None
    
    def _initialize_paddle_ocr(self):
        """Initialize PaddleOCR reader"""
        if not PADDLE_AVAILABLE:
            self.logger.info("ℹ️ PaddleOCR not available - skipping initialization")
            return
        
        try:
            self._paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en')
            self.logger.info("✅ PaddleOCR initialized successfully")
        except Exception as e:
            self.logger.warning(f"⚠️ PaddleOCR initialization failed: {e}")
            self._paddle_ocr = None
    
    def extract_text_multimethod(self, image_input: Any) -> Dict[str, Any]:
        """
        Extract text using ALL OCR methods, display each result, and select the best one
        
        Args:
            image_input: Image file path or numpy array
            
        Returns:
            Dictionary with best text, confidence, and metadata
        """
        self.logger.info("=" * 80)
        self.logger.info("📖 STARTING MULTI-METHOD OCR EXTRACTION (4 ENGINES)")
        self.logger.info("=" * 80)
        
        # Load image if path provided
        if isinstance(image_input, str):
            image = cv2.imread(image_input)
            if image is None:
                raise ValueError(f"Could not load image: {image_input}")
        else:
            image = image_input
        
        self.logger.info(f"📊 Image shape: {image.shape}, dtype: {image.dtype}")
        self.logger.info("")
        
        # Run ALL OCR methods and collect results
        all_results = []
        
        # 1. EasyOCR
        self.logger.info("🔍 [1/4] RUNNING EASYOCR...")
        self.logger.info("-" * 80)
        if self._easyocr_reader:
            easyocr_result = self._extract_with_easyocr(image)
            if easyocr_result:
                all_results.append(easyocr_result)
                self.logger.info("📄 EASYOCR EXTRACTED TEXT:")
                self.logger.info(f"{easyocr_result.text}")
                self.logger.info(f"✓ Confidence: {easyocr_result.confidence:.2%}")
                self.logger.info(f"✓ Characters: {len(easyocr_result.text)}")
                self.logger.info(f"✓ Words: {len(easyocr_result.text.split())}")
            else:
                self.logger.warning("❌ EasyOCR failed to extract text")
        else:
            self.logger.warning("⚠️ EasyOCR not initialized")
        self.logger.info("")
        
        # 2. Tesseract
        self.logger.info("🔍 [2/4] RUNNING TESSERACT...")
        self.logger.info("-" * 80)
        tesseract_result = self._extract_with_tesseract(image)
        if tesseract_result:
            all_results.append(tesseract_result)
            self.logger.info("📄 TESSERACT EXTRACTED TEXT:")
            self.logger.info(f"{tesseract_result.text}")
            self.logger.info(f"✓ Confidence: {tesseract_result.confidence:.2%}")
            self.logger.info(f"✓ Characters: {len(tesseract_result.text)}")
            self.logger.info(f"✓ Words: {len(tesseract_result.text.split())}")
        else:
            self.logger.warning("❌ Tesseract failed to extract text")
        self.logger.info("")
        
        # 3. TrOCR (Transformer-based for handwriting)
        self.logger.info("🔍 [3/4] RUNNING TROCR (Handwritten Specialist)...")
        self.logger.info("-" * 80)
        if self._trocr_processor and self._trocr_model:
            trocr_result = self._extract_with_trocr(image)
            if trocr_result:
                all_results.append(trocr_result)
                self.logger.info("📄 TROCR EXTRACTED TEXT:")
                self.logger.info(f"{trocr_result.text}")
                self.logger.info(f"✓ Confidence: {trocr_result.confidence:.2%}")
                self.logger.info(f"✓ Characters: {len(trocr_result.text)}")
                self.logger.info(f"✓ Words: {len(trocr_result.text.split())}")
            else:
                self.logger.warning("❌ TrOCR failed to extract text")
        else:
            self.logger.warning("⚠️ TrOCR not initialized")
        self.logger.info("")
        
        # 4. PaddleOCR
        self.logger.info("🔍 [4/4] RUNNING PADDLEOCR...")
        self.logger.info("-" * 80)
        if self._paddle_ocr:
            paddle_result = self._extract_with_paddleocr(image)
            if paddle_result:
                all_results.append(paddle_result)
                self.logger.info("📄 PADDLEOCR EXTRACTED TEXT:")
                self.logger.info(f"{paddle_result.text}")
                self.logger.info(f"✓ Confidence: {paddle_result.confidence:.2%}")
                self.logger.info(f"✓ Characters: {len(paddle_result.text)}")
                self.logger.info(f"✓ Words: {len(paddle_result.text.split())}")
            else:
                self.logger.warning("❌ PaddleOCR failed to extract text")
        else:
            self.logger.warning("⚠️ PaddleOCR not initialized")
        self.logger.info("")
        
        if not all_results:
            self.logger.error("❌ ALL OCR METHODS FAILED!")
            raise RuntimeError("All OCR methods failed to extract text")
        
        # Compare and select the best result
        self.logger.info("=" * 80)
        self.logger.info("📊 COMPARING ALL OCR RESULTS...")
        self.logger.info("=" * 80)
        best_result = self._select_best_result(all_results)
        
        self.logger.info(f"🏆 SELECTED: {best_result.method}")
        self.logger.info(f"   Reason: Highest quality score")
        self.logger.info("")
        
        # Calculate overall quality
        quality_score = self._calculate_quality_score(best_result.text)
        
        return {
            'text': best_result.text,
            'methods_used': [r.method for r in all_results],
            'confidence': best_result.confidence,
            'quality_score': quality_score,
            'individual_results': {
                result.method: {
                    'text': result.text,
                    'confidence': result.confidence
                }
                for result in all_results
            }
        }
    
    def _extract_with_easyocr(self, image: np.ndarray) -> Optional[OCRResult]:
        """Extract text using EasyOCR"""
        if not self._easyocr_reader:
            return None
        
        try:
            self.logger.debug("🔍 Running EasyOCR extraction...")
            
            # EasyOCR returns list of ([bbox], text, confidence) tuples
            results = self._easyocr_reader.readtext(image)
            
            if not results:
                self.logger.debug("  ⚠️ EasyOCR returned no results")
                return None
            
            # Extract text and calculate average confidence
            texts = [text for (_, text, conf) in results]
            confidences = [conf for (_, text, conf) in results]
            
            full_text = '\n'.join(texts)
            avg_confidence = np.mean(confidences) if confidences else 0.0
            
            self.logger.info(f"  ✅ EasyOCR: {len(texts)} text segments detected")
            self.logger.info(f"     - Average confidence: {avg_confidence:.2%}")
            self.logger.info(f"     - Total characters: {len(full_text)}")
            self.logger.debug(f"     - Text preview: {full_text[:100]}...")
            
            return OCRResult(
                method='EasyOCR',
                text=full_text,
                confidence=avg_confidence,
                bounding_boxes=[box for (box, _, _) in results],
                raw_output=results
            )
        except Exception as e:
            self.logger.warning(f"❌ EasyOCR failed: {e}")
            return None
    
    def _extract_with_tesseract(self, image: np.ndarray) -> Optional[OCRResult]:
        """Extract text using Tesseract OCR"""
        try:
            self.logger.debug("🔍 Running Tesseract extraction...")
            
            # Try multiple PSM (Page Segmentation Mode) modes for best results
            best_text = ""
            best_confidence = 0.0
            
            # PSM 3: Fully automatic page segmentation, but no OSD
            # PSM 6: Assume a single uniform block of text
            for psm in [3, 6]:
                try:
                    custom_config = f'--psm {psm}'
                    result = pytesseract.image_to_string(image, config=custom_config)
                    
                    if result.strip():
                        # If we got text, assign reasonable confidence
                        avg_confidence = 0.75  # Reasonable default for Tesseract
                        
                        try:
                            data = pytesseract.image_to_data(image, config=custom_config, output_type=pytesseract.Output.DICT)
                            confidences = [int(conf) for conf in data['confidence'] if int(conf) > 0]
                            if confidences:
                                avg_confidence = np.mean(confidences) / 100.0
                        except:
                            pass  # Use default confidence
                        
                        if avg_confidence > best_confidence:
                            best_text = result
                            best_confidence = avg_confidence
                        
                except Exception as e:
                    self.logger.debug(f"  PSM {psm} failed: {e}")
                    continue
            
            if not best_text.strip():
                self.logger.debug("  ⚠️ Tesseract returned no results")
                return None
            
            self.logger.info(f"  ✅ Tesseract: {best_confidence:.2%} confidence, {len(best_text.split())} words")
            
            return OCRResult(
                method='Tesseract',
                text=best_text,
                confidence=best_confidence,
                raw_output=None
            )
        except Exception as e:
            self.logger.warning(f"❌ Tesseract failed: {e}")
            return None
    
    def _extract_with_paddleocr(self, image: np.ndarray) -> Optional[OCRResult]:
        """Extract text using PaddleOCR"""
        if not self._paddle_ocr or not PADDLE_AVAILABLE:
            return None
        
        try:
            self.logger.debug("🔍 Running PaddleOCR extraction...")
            
            # PaddleOCR returns list of ([bbox], (text, confidence)) tuples
            results = self._paddle_ocr.ocr(image, cls=True)
            
            if not results or not results[0]:
                self.logger.debug("  ⚠️ PaddleOCR returned no results")
                return None
            
            # Extract text and confidence
            texts = []
            confidences = []
            
            for line in results:
                for item in line:
                    text, confidence = item[1]
                    texts.append(text)
                    confidences.append(confidence)
            
            full_text = '\n'.join(texts)
            avg_confidence = np.mean(confidences) if confidences else 0.0
            
            self.logger.debug(f"  ✅ PaddleOCR: {len(texts)} lines, {avg_confidence:.2%} confidence")
            
            return OCRResult(
                method='PaddleOCR',
                text=full_text,
                confidence=avg_confidence,
                raw_output=results
            )
        except Exception as e:
            self.logger.warning(f"❌ PaddleOCR failed: {e}")
            return None
    
    def _extract_with_trocr(self, image: np.ndarray) -> Optional[OCRResult]:
        """Extract text using TrOCR (Transformer-based OCR for handwriting)"""
        if not self._trocr_processor or not self._trocr_model:
            return None
        
        try:
            self.logger.debug("🔍 Running TrOCR extraction...")
            
            # Convert to PIL Image
            if len(image.shape) == 3:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                image_rgb = image
            
            pil_image = Image.fromarray(image_rgb)
            
            # Process with TrOCR
            pixel_values = self._trocr_processor(pil_image, return_tensors="pt").pixel_values
            
            with torch.no_grad():
                generated_ids = self._trocr_model.generate(pixel_values)
            
            generated_text = self._trocr_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            if not generated_text.strip():
                self.logger.debug("  ⚠️ TrOCR returned no text")
                return None
            
            # TrOCR doesn't provide confidence, use moderate default
            confidence = 0.70
            
            self.logger.debug(f"  ✅ TrOCR: {len(generated_text.split())} words extracted")
            
            return OCRResult(
                method='TrOCR',
                text=generated_text,
                confidence=confidence,
                raw_output=None
            )
        except Exception as e:
            self.logger.warning(f"❌ TrOCR failed: {e}")
            return None
    
    def _select_best_result(self, results: List[OCRResult]) -> OCRResult:
        """
        Select the best OCR result based on multiple criteria
        
        Args:
            results: List of OCR results from different methods
            
        Returns:
            Best OCR result
        """
        self.logger.info("🔍 Analyzing all OCR results...")
        
        best_result = None
        best_score = -1
        
        for result in results:
            # Calculate comprehensive quality score
            text = result.text
            confidence = result.confidence
            
            # Scoring factors:
            # 1. Confidence (40%)
            # 2. Text length (20%)
            # 3. Medical keywords (30%)
            # 4. Line structure (10%)
            
            confidence_score = confidence * 0.4
            
            length_score = min(1.0, len(text) / 300) * 0.2
            
            medical_score = self._calculate_medical_keyword_score(text) * 0.3
            
            lines = [l for l in text.split('\n') if l.strip()]
            line_score = min(1.0, len(lines) / 10) * 0.1
            
            total_score = confidence_score + length_score + medical_score + line_score
            
            self.logger.info(f"  {result.method}:")
            self.logger.info(f"    - Confidence: {confidence:.2%} → {confidence_score:.3f}")
            self.logger.info(f"    - Length: {len(text)} chars → {length_score:.3f}")
            self.logger.info(f"    - Medical keywords → {medical_score:.3f}")
            self.logger.info(f"    - Line structure: {len(lines)} lines → {line_score:.3f}")
            self.logger.info(f"    ➤ TOTAL SCORE: {total_score:.3f}")
            self.logger.info("")
            
            if total_score > best_score:
                best_score = total_score
                best_result = result
        
        return best_result
    
    def _merge_results(self, results: List[OCRResult]) -> Dict[str, Any]:
        """
        Merge OCR results using voting mechanism (DEPRECATED - use _select_best_result)
        Kept for backward compatibility
```
        Weight methods by confidence and medical keyword presence
        
        Args:
            results: List of OCR results from different methods
            
        Returns:
            Merged result with best text and weighted confidence
        """
        self.logger.info("🗳️ Merging OCR results using voting mechanism...")
        
        # Calculate weighted scores for each result
        weighted_scores = []
        
        for result in results:
            # Base score is the confidence
            base_score = result.confidence
            
            # Bonus for medical keywords
            medical_score = self._calculate_medical_keyword_score(result.text)
            
            # Combined score (70% confidence, 30% medical keywords)
            weighted_score = (base_score * 0.7) + (medical_score * 0.3)
            
            weighted_scores.append({
                'result': result,
                'base_confidence': result.confidence,
                'medical_score': medical_score,
                'weighted_score': weighted_score
            })
            
            self.logger.debug(
                f"  {result.method}: confidence={result.confidence:.2%}, "
                f"medical_score={medical_score:.2%}, weighted={weighted_score:.2%}"
            )
        
        # Select result with highest weighted score
        best = max(weighted_scores, key=lambda x: x['weighted_score'])
        
        self.logger.info(f"  ✅ Selected: {best['result'].method} (score: {best['weighted_score']:.2%})")
        
        # Merge unique lines from other methods if they have decent scores
        lines_seen = set()
        all_lines = []
        
        # Add best result lines
        for line in best['result'].text.split('\n'):
            if line.strip():
                all_lines.append(line)
                lines_seen.add(line.lower().strip())
        
        # Add unique lines from other methods
        for scored_result in weighted_scores:
            if scored_result['result'] != best['result'] and scored_result['weighted_score'] >= 0.4:
                for line in scored_result['result'].text.split('\n'):
                    if line.strip() and line.lower().strip() not in lines_seen:
                        all_lines.append(f"[{scored_result['result'].method}] {line}")
                        lines_seen.add(line.lower().strip())
        
        merged_text = '\n'.join(all_lines)
        
        # Calculate weighted confidence
        avg_weighted_confidence = np.mean([s['weighted_score'] for s in weighted_scores])
        
        return {
            'text': merged_text,
            'confidence': avg_weighted_confidence,
            'primary_method': best['result'].method
        }
    
    def _calculate_medical_keyword_score(self, text: str) -> float:
        """
        Calculate medical keyword presence score
        Higher if text contains medical-related keywords
        
        Args:
            text: Extracted text
            
        Returns:
            Score from 0.0 to 1.0
        """
        text_lower = text.lower()
        keywords_found = 0
        
        # Count keyword matches
        for keyword in MEDICAL_KEYWORDS['english']:
            if keyword in text_lower:
                keywords_found += 1
        
        # More lenient scoring for medical content
        # Even 1-2 keywords should give decent score
        if keywords_found >= 5:
            score = 0.95
        elif keywords_found >= 3:
            score = 0.80
        elif keywords_found >= 1:
            score = 0.60
        else:
            score = 0.0
        
        # Clamp to 0-1 range
        return min(1.0, max(0.0, score))
    
    def _calculate_quality_score(self, text: str) -> float:
        """
        Calculate overall quality score of extracted text
        Prescription-specific scoring (don't penalize for few lines/keywords)
        
        Args:
            text: Extracted text
            
        Returns:
            Quality score from 0.0 to 1.0
        """
        if not text or not text.strip():
            return 0.0
        
        scores = []
        
        # Text length score (shorter is OK for prescriptions)
        # Prescriptions can be brief - just need some text
        length = len(text)
        if length > 30:  # At least some minimum
            length_score = min(1.0, length / 300)  # More lenient threshold
        else:
            length_score = 0.3  # Partial credit for minimal text
        scores.append(length_score)
        
        # Medical keywords score (important indicator)
        medical_score = self._calculate_medical_keyword_score(text)
        scores.append(medical_score * 0.8)  # Weight it but don't make it required
        
        # Line count score (prescriptions can be 1-15 lines)
        lines = [l for l in text.split('\n') if l.strip()]
        if len(lines) >= 1:  # Any non-empty lines is good
            line_score = min(1.0, len(lines) / 5)  # Easier threshold
        else:
            line_score = 0.0
        scores.append(line_score)
        
        # Base score for having any content
        base_score = 0.5
        scores.append(base_score)
        
        # Average all scores
        overall_score = np.mean(scores)
        
        return min(1.0, max(0.0, overall_score))
    
    def validate_extracted_text(self, text: str) -> Dict[str, Any]:
        """
        Validate extracted text for medical content
        More lenient for prescription analysis
        
        Args:
            text: Extracted text
            
        Returns:
            Validation result dictionary
        """
        validation_result = {
            'valid': False,
            'has_content': len(text.strip()) > 0,
            'has_medical_keywords': False,
            'confidence_level': 'low',
            'issues': []
        }
        
        if not validation_result['has_content']:
            validation_result['issues'].append("No text extracted")
            return validation_result
        
        # Check for medical keywords
        text_lower = text.lower()
        medical_keywords_found = sum(
            1 for keyword in MEDICAL_KEYWORDS['english']
            if keyword in text_lower
        )
        
        validation_result['has_medical_keywords'] = medical_keywords_found >= 1  # More lenient
        
        # Determine confidence level (more lenient thresholds)
        if medical_keywords_found >= 5:
            validation_result['confidence_level'] = 'high'
            validation_result['valid'] = True
        elif medical_keywords_found >= 2:
            validation_result['confidence_level'] = 'medium'
            validation_result['valid'] = True
        elif medical_keywords_found >= 1:
            validation_result['confidence_level'] = 'medium-low'
            validation_result['valid'] = True  # Still valid with minimal keywords
        elif len(text.strip()) > 20:  # Any reasonable text length
            validation_result['confidence_level'] = 'low'
            validation_result['valid'] = True  # Still try to process
            validation_result['issues'].append("Limited medical keywords - may not be a prescription")
        else:
            validation_result['confidence_level'] = 'low'
            validation_result['issues'].append("Very limited content - may not be a prescription")
        
        return validation_result
