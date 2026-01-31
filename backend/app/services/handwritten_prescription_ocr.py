"""
Handwritten Prescription OCR Service
Implements the complete correct pipeline:
Upload → Normalize → Detect Lines → Crop → Preprocess Each → TrOCR → Sort → Merge
"""

import cv2
import numpy as np
import logging
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image
import tempfile
import os

logger = logging.getLogger(__name__)

# Try to import TrOCR components
HAVE_TROCR = False
try:
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    import torch
    HAVE_TROCR = True
    logger.info("✅ TrOCR components loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️ TrOCR not available: {e}")

# Try to import text detection (CRAFT or DBNet)
HAVE_CRAFT = False
try:
    import craft_text_detector
    HAVE_CRAFT = True
    logger.info("✅ CRAFT text detector loaded successfully")
except ImportError:
    logger.debug("⚠️ CRAFT not available, will use alternative detection")


class TextLineDetector:
    """
    Detects text regions/lines in handwritten prescription images.
    Falls back to contour-based detection if CRAFT unavailable.
    """
    
    @staticmethod
    def detect_text_regions(image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect text regions in image using CRAFT or contour-based detection.
        
        Args:
            image: Input image (grayscale or color)
            
        Returns:
            List of bounding boxes [(x1, y1, x2, y2), ...]
        """
        logger.info("🔍 Detecting text regions...")
        
        if HAVE_CRAFT:
            return TextLineDetector._detect_with_craft(image)
        else:
            return TextLineDetector._detect_with_contours(image)
    
    @staticmethod
    def _detect_with_craft(image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect text using CRAFT detector."""
        try:
            # CRAFT expects color image
            if len(image.shape) == 2:
                image_color = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            else:
                image_color = image
            
            # Initialize CRAFT detector
            craft = craft_text_detector.Craft(
                output_dir=tempfile.gettempdir(),
                weight_path='craft_mlt_25k.pth'
            )
            
            # Detect text regions
            prediction_result = craft.detect_text(image_color)
            boxes = prediction_result.get('boxes', [])
            
            logger.info(f"✅ CRAFT detected {len(boxes)} text regions")
            
            # Convert CRAFT format to standard [x1, y1, x2, y2]
            standard_boxes = []
            for box in boxes:
                if isinstance(box, np.ndarray):
                    x_coords = box[:, 0]
                    y_coords = box[:, 1]
                    x1, x2 = int(np.min(x_coords)), int(np.max(x_coords))
                    y1, y2 = int(np.min(y_coords)), int(np.max(y_coords))
                    standard_boxes.append((x1, y1, x2, y2))
            
            return standard_boxes
            
        except Exception as e:
            logger.warning(f"⚠️ CRAFT detection failed: {e}. Falling back to contour detection.")
            return TextLineDetector._detect_with_contours(image)
    
    @staticmethod
    def _detect_with_contours(image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect text regions using contour analysis.
        Fallback method when CRAFT is unavailable.
        """
        logger.info("🔍 Using contour-based text region detection...")
        
        # Ensure grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Apply adaptive thresholding (invert so text is white)
        binary = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            21, 5
        )

        # Connect characters within the same line to form line contours
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 3))
        connected = cv2.dilate(binary, kernel, iterations=1)
        
        # Find contours
        contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter and get bounding rectangles for text-like contours
        boxes = []
        min_area = 20  # Minimum area for text regions
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < min_area:
                continue
            
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by aspect ratio (text lines are typically wider than tall)
            aspect_ratio = w / max(h, 1)
            if 0.5 < aspect_ratio < 20:  # Reasonable for text
                boxes.append((x, y, x + w, y + h))
        
        logger.info(f"✅ Contour detection found {len(boxes)} text regions")
        return boxes


class PrescriptionImageNormalizer:
    """
    Normalize images for handwritten prescription OCR.
    """
    
    @staticmethod
    def normalize_image(image) -> np.ndarray:
        """
        Normalize image for handwritten text recognition.
        
        Args:
            image: PIL Image or numpy array or file path
            
        Returns:
            Normalized grayscale image
        """
        # Load image if path
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Could not load image from {image}")
            if len(img.shape) == 3:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            else:
                gray = img
        elif isinstance(image, Image.Image):
            # PIL Image to numpy
            img_array = np.array(image)
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
        else:
            # Assume numpy array
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
        
        # Apply bilateral filter (edge-preserving smoothing)
        normalized = cv2.bilateralFilter(gray, 9, 75, 75)
        
        logger.debug(f"Image normalized. Shape: {normalized.shape}")
        return normalized


class TextCropPreprocessor:
    """
    Preprocess individual text crop images for TrOCR.
    """
    
    @staticmethod
    def preprocess_crop(crop: np.ndarray) -> Image.Image:
        """
        Preprocess a single text crop for TrOCR.
        
        Args:
            crop: Text crop image (numpy array)
            
        Returns:
            PIL Image ready for TrOCR
        """
        # Ensure grayscale
        if len(crop.shape) == 3:
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        else:
            gray = crop

        # Contrast enhancement (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Adaptive thresholding (text = black on white background)
        binary = cv2.adaptiveThreshold(
            enhanced, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,  # Block size (must be odd)
            11   # Constant subtracted from mean
        )

        # Add padding to avoid clipped characters
        pad = 8
        binary = cv2.copyMakeBorder(
            binary, pad, pad, pad, pad,
            borderType=cv2.BORDER_CONSTANT,
            value=255
        )

        # Resize to a consistent height while keeping aspect ratio
        target_h = 64
        h, w = binary.shape
        scale = target_h / max(h, 1)
        new_w = max(1, int(w * scale))
        resized = cv2.resize(binary, (new_w, target_h), interpolation=cv2.INTER_CUBIC)

        # Convert to PIL Image and ensure RGB (TrOCR expects RGB)
        pil_image = Image.fromarray(resized).convert("RGB")

        return pil_image
    
    @staticmethod
    def extract_line_crops(image: np.ndarray, boxes: List[Tuple[int, int, int, int]]) -> List[Tuple[int, np.ndarray]]:
        """
        Extract individual line crops from detected bounding boxes.
        Store Y coordinate for later sorting.
        
        Args:
            image: Original image (numpy array)
            boxes: List of bounding boxes [(x1, y1, x2, y2), ...]
            
        Returns:
            List of (y_coordinate, crop_image) tuples
        """
        logger.info(f"📍 Extracting {len(boxes)} text line crops...")
        
        line_crops = []
        
        for box in boxes:
            x1, y1, x2, y2 = box
            
            # Ensure bounds are valid
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(image.shape[1], x2)
            y2 = min(image.shape[0], y2)
            
            # Skip invalid crops
            if x2 <= x1 or y2 <= y1:
                continue
            
            # Extract crop
            crop = image[y1:y2, x1:x2]

            # Only split very tall crops (> 100px height) to avoid over-fragmenting
            crop_h = y2 - y1
            if crop_h > 100:
                split_crops = TextCropPreprocessor._split_lines_in_crop(crop)
                if len(split_crops) > 1:
                    for split_y, split_crop in split_crops:
                        # Store with Y coordinate for sorting (relative to original image)
                        line_crops.append((y1 + split_y, split_crop))
                else:
                    # Store with Y coordinate for sorting
                    line_crops.append((y1, crop))
            else:
                # Store with Y coordinate for sorting
                line_crops.append((y1, crop))
        
        logger.debug(f"✅ Extracted {len(line_crops)} valid crops")
        return line_crops

    @staticmethod
    def _split_lines_in_crop(crop: np.ndarray) -> List[Tuple[int, np.ndarray]]:
        """
        Attempt to split a large crop into multiple text lines using horizontal projection.
        Returns list of (y_offset, crop) tuples. Empty list means no reliable split.
        """
        try:
            if crop is None or crop.size == 0:
                return []

            # Convert to grayscale
            if len(crop.shape) == 3:
                gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            else:
                gray = crop

            # Binarize (text = white)
            binary = cv2.adaptiveThreshold(
                gray, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV,
                21, 5
            )

            h, w = binary.shape
            if h < 40:
                return []

            # Horizontal projection: sum of white pixels per row
            row_sum = (binary > 0).sum(axis=1)
            threshold = max(5, int(0.02 * w))

            # Identify rows that likely contain text
            text_rows = row_sum > threshold

            # Find contiguous text row ranges
            lines = []
            in_line = False
            start = 0
            for i, is_text in enumerate(text_rows):
                if is_text and not in_line:
                    in_line = True
                    start = i
                elif not is_text and in_line:
                    end = i
                    if end - start >= 8:  # minimum line height
                        lines.append((start, end))
                    in_line = False
            if in_line:
                end = h
                if end - start >= 8:
                    lines.append((start, end))

            # If only one line detected, no split
            if len(lines) <= 1:
                return []

            # Build crops with padding
            results = []
            pad = 6
            for (y_start, y_end) in lines:
                y1 = max(0, y_start - pad)
                y2 = min(h, y_end + pad)
                line_crop = crop[y1:y2, :]
                results.append((y1, line_crop))

            return results
        except Exception as e:
            logger.debug(f"Line split failed: {e}")
            return []


class TrOCRRecognizer:
    """
    Handwritten text recognition using TrOCR.
    Processes individual text crops, one at a time.
    """
    
    _processor = None
    _model = None
    _device = None
    MODEL_NAME = "microsoft/trocr-large-handwritten"  # Use large model for better accuracy
    
    @staticmethod
    def _initialize_trocr():
        """Initialize TrOCR processor and model."""
        if TrOCRRecognizer._model is not None:
            return
        
        if not HAVE_TROCR:
            raise RuntimeError("TrOCR dependencies not installed")
        
        logger.info("📥 Loading TrOCR model...")
        
        # Determine device with detailed GPU detection
        if torch.cuda.is_available():
            TrOCRRecognizer._device = torch.device("cuda")
            gpu_name = torch.cuda.get_device_name(0)
            logger.info(f"✅ GPU detected: {gpu_name}")
            logger.info(f"Using device: cuda (GPU acceleration enabled)")
        else:
            TrOCRRecognizer._device = torch.device("cpu")
            logger.warning("⚠️ No GPU detected. Using CPU (slower). Install CUDA PyTorch for GPU support.")
            logger.info(f"Using device: cpu")
        
        # Load processor and model (prefer local cache on network failure)
        model_name = TrOCRRecognizer.MODEL_NAME
        logger.info(f"Loading model: {model_name}")
        
        try:
            TrOCRRecognizer._processor = TrOCRProcessor.from_pretrained(
                model_name,
                use_fast=False
            )
            TrOCRRecognizer._model = VisionEncoderDecoderModel.from_pretrained(
                model_name
            )
            logger.info(f"✅ Model loaded from online/cache")
        except Exception as e:
            logger.warning(f"⚠️ Large model load failed: {e}. Falling back to base model...")
            model_name = "microsoft/trocr-base-handwritten"
            try:
                TrOCRRecognizer._processor = TrOCRProcessor.from_pretrained(
                    model_name,
                    use_fast=False
                )
                TrOCRRecognizer._model = VisionEncoderDecoderModel.from_pretrained(
                    model_name
                )
                logger.info(f"✅ Base model loaded as fallback")
            except Exception as e2:
                logger.warning(f"⚠️ Online load failed: {e2}. Trying local cache...")
                TrOCRRecognizer._processor = TrOCRProcessor.from_pretrained(
                    model_name,
                    use_fast=False,
                    local_files_only=True
                )
                TrOCRRecognizer._model = VisionEncoderDecoderModel.from_pretrained(
                    model_name,
                    local_files_only=True
                )
                logger.info(f"✅ Loaded from local cache")
        
        # Move to device
        TrOCRRecognizer._model = TrOCRRecognizer._model.to(TrOCRRecognizer._device)
        TrOCRRecognizer._model.eval()  # Set to evaluation mode
        
        logger.info("✅ TrOCR model loaded successfully")
    
    @staticmethod
    def recognize_text_crop(crop_image: Image.Image) -> str:
        """
        Recognize text in a single image crop using TrOCR.
        
        Args:
            crop_image: PIL Image of text crop
            
        Returns:
            Recognized text
        """
        TrOCRRecognizer._initialize_trocr()
        
        try:
            # Prepare pixel values
            pixel_values = TrOCRRecognizer._processor(
                crop_image,
                return_tensors="pt"
            ).pixel_values.to(TrOCRRecognizer._device)
            
            # Generate text with increased max length for full medicine names
            with torch.no_grad():
                generated_ids = TrOCRRecognizer._model.generate(
                    pixel_values,
                    max_length=128,
                    num_beams=5,
                    early_stopping=True
                )
            
            # Decode
            text = TrOCRRecognizer._processor.batch_decode(
                generated_ids,
                skip_special_tokens=True
            )[0]
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"❌ TrOCR recognition failed: {e}")
            return ""
    
    @staticmethod
    def recognize_line_crops(line_crops: List[Tuple[int, np.ndarray]]) -> List[Tuple[int, str]]:
        """
        Recognize text in multiple line crops.
        Process one crop at a time.
        
        Args:
            line_crops: List of (y_coordinate, crop_image) tuples
            
        Returns:
            List of (y_coordinate, recognized_text) tuples
        """
        logger.info(f"🧠 Recognizing text in {len(line_crops)} crops...")
        
        results = []
        
        for i, (y_coord, crop) in enumerate(line_crops):
            logger.debug(f"Processing crop {i+1}/{len(line_crops)} (Y={y_coord})")
            
            # Preprocess crop
            pil_crop = TextCropPreprocessor.preprocess_crop(crop)
            
            # Recognize with TrOCR
            text = TrOCRRecognizer.recognize_text_crop(pil_crop)
            
            if text:
                results.append((y_coord, text))
                logger.debug(f"  ✅ Recognized: {text}")
            else:
                logger.debug(f"  ⚠️ No text recognized")
        
        logger.info(f"✅ Recognized text in {len(results)} crops")
        return results


class HandwrittenPrescriptionOCR:
    """
    Complete pipeline for handwritten prescription OCR.
    """
    
    @staticmethod
    def process_prescription_image(image_path: str) -> Dict[str, Any]:
        """
        Complete pipeline: Normalize → Detect → Crop → Preprocess → TrOCR → Sort → Merge
        
        Args:
            image_path: Path to prescription image
            
        Returns:
            Dictionary with recognized text and metadata
        """
        logger.info(f"🏥 Starting handwritten prescription OCR for: {image_path}")
        
        try:
            # STEP 1: Load and normalize image
            logger.info("📸 STEP 1: Loading and normalizing image...")
            normalized_image = PrescriptionImageNormalizer.normalize_image(image_path)
            
            # STEP 2: Detect text lines
            logger.info("🔍 STEP 2: Detecting text regions...")
            boxes = TextLineDetector.detect_text_regions(normalized_image)
            
            if not boxes:
                logger.warning("⚠️ No text regions detected")
                return {
                    "status": "warning",
                    "message": "Could not detect text regions. Image may be too unclear.",
                    "ocr_text": "",
                    "text_lines": [],
                    "error": "No text regions found"
                }
            
            logger.info(f"✅ Detected {len(boxes)} text regions")
            
            # STEP 3: Load original image for cropping
            logger.info("📍 STEP 3: Extracting text line crops...")
            original_image = cv2.imread(image_path)
            if original_image is None:
                raise ValueError(f"Could not load original image from {image_path}")
            
            line_crops = TextCropPreprocessor.extract_line_crops(original_image, boxes)
            
            if not line_crops:
                logger.warning("⚠️ No valid crops extracted")
                return {
                    "status": "warning",
                    "message": "Could not extract valid text crops.",
                    "ocr_text": "",
                    "text_lines": [],
                    "error": "No valid crops"
                }
            
            # STEP 4-6: Preprocess and recognize (done in TrOCR step)
            logger.info("🧠 STEP 4-6: Preprocessing and recognizing with TrOCR...")
            recognized_lines = TrOCRRecognizer.recognize_line_crops(line_crops)
            
            # STEP 7: Sort by Y coordinate (reading order)
            logger.info("📍 STEP 7: Sorting lines in reading order...")
            recognized_lines = sorted(recognized_lines, key=lambda x: x[0])
            
            # STEP 8: Join final text
            logger.info("📝 STEP 8: Joining final text...")
            final_text = "\n".join([text for _, text in recognized_lines])
            
            result = {
                "status": "success",
                "message": "Prescription OCR completed successfully",
                "ocr_text": final_text,
                "text_lines": [text for _, text in recognized_lines],
                "num_lines_detected": len(recognized_lines),
                "pipeline_stages": {
                    "normalization": "✅ Complete",
                    "text_detection": "✅ Complete",
                    "crop_extraction": "✅ Complete",
                    "trocr_recognition": "✅ Complete",
                    "sorting": "✅ Complete",
                    "merging": "✅ Complete"
                },
                "warnings": [
                    "This analysis is AI-assisted and should be verified with the original prescription",
                    "Non-Latin scripts may not be recognized correctly",
                    "Always consult a healthcare professional before taking any medicines",
                    "Dosages and frequencies should be confirmed with your doctor"
                ]
            }
            
            logger.info(f"🎉 Prescription OCR successful. Extracted {len(recognized_lines)} text lines")
            return result
            
        except ValueError as ve:
            logger.error(f"❌ Validation error: {ve}")
            return {
                "status": "error",
                "error": f"Invalid image or preprocessing error: {str(ve)}",
                "ocr_text": "",
                "text_lines": []
            }
        except RuntimeError as re:
            logger.error(f"❌ Runtime error: {re}")
            return {
                "status": "error",
                "error": f"Text recognition error: {str(re)}",
                "ocr_text": "",
                "text_lines": []
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
            return {
                "status": "error",
                "error": f"Prescription OCR failed: {str(e)}",
                "ocr_text": "",
                "text_lines": [],
                "traceback": str(e)
            }
    
    @staticmethod
    def process_prescription_from_bytes(image_bytes: bytes, filename: str = "prescription.jpg") -> Dict[str, Any]:
        """
        Process prescription from image bytes (for API uploads).
        
        Args:
            image_bytes: Image file content as bytes
            filename: Original filename
            
        Returns:
            Dictionary with OCR results
        """
        logger.info(f"📥 Received prescription image for OCR: {filename}")
        
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
            
            # Process prescription
            result = HandwrittenPrescriptionOCR.process_prescription_image(temp_file_path)
            result['uploaded_file'] = filename
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing prescription bytes: {e}")
            return {
                "status": "error",
                "error": f"Failed to process prescription image: {str(e)}",
                "ocr_text": "",
                "text_lines": []
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
        """Get information about the handwritten prescription OCR service."""
        return {
            "service_name": "Handwritten Prescription OCR Service",
            "description": "Analyzes handwritten prescription images using line detection and TrOCR",
            "trocr_available": HAVE_TROCR,
            "craft_available": HAVE_CRAFT,
            "pipeline": {
                "step_1": {
                    "name": "Image Normalization",
                    "technique": "Bilateral filtering for edge-preserving smoothing"
                },
                "step_2": {
                    "name": "Text Region Detection",
                    "technique": "CRAFT or contour-based detection"
                },
                "step_3": {
                    "name": "Text Line Extraction",
                    "technique": "Bounding box cropping with Y coordinate tracking"
                },
                "step_4": {
                    "name": "Crop Preprocessing",
                    "technique": "Adaptive thresholding per crop"
                },
                "step_5": {
                    "name": "Handwritten Text Recognition",
                    "model": "microsoft/trocr-base-handwritten",
                    "framework": "Transformers + PyTorch"
                },
                "step_6": {
                    "name": "Line Sorting",
                    "technique": "Sort by Y coordinate for reading order"
                },
                "step_7": {
                    "name": "Text Merging",
                    "technique": "Join lines with newline separators"
                }
            },
            "supported_formats": ["jpg", "jpeg", "png", "bmp", "tiff"],
            "max_file_size_mb": 10,
            "output_format": {
                "status": "success/error/warning",
                "ocr_text": "Full recognized text with line breaks",
                "text_lines": "Array of individual recognized lines",
                "num_lines_detected": "Number of detected text lines",
                "pipeline_stages": "Status of each pipeline step"
            }
        }
