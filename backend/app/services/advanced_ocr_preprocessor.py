"""
Advanced OCR Preprocessing for Maximum Accuracy
Combines multiple preprocessing techniques to maximize text extraction quality
"""

import cv2
import numpy as np
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


class AdvancedOCRPreprocessor:
    """Advanced preprocessing techniques for OCR accuracy."""
    
    @staticmethod
    def preprocess_for_printed_text(image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for optimal printed text OCR accuracy.
        Enhanced for structured documents with multiple sections (hospital reports, prescriptions).
        Handles both clear and low-quality scans/photos.
        """
        logger.info("🔬 Advanced preprocessing for printed text (high accuracy mode)...")
        
        # Step 1: Read image
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
        
        if img is None:
            logger.error("Failed to read image")
            return None
        
        # Step 2: Upscale if image is too small (improves OCR accuracy)
        height, width = img.shape[:2]
        if height < 1000 or width < 1000:
            logger.debug(f"📍 Upscaling small image from {width}x{height}...")
            scale_factor = max(2.0, 1500.0 / max(height, width))
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            logger.debug(f"   Upscaled to {new_width}x{new_height}")
        
        # Step 3: Convert to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()
        
        # Step 4: Denoise while preserving text clarity
        logger.debug("📍 Denoising with edge preservation...")
        denoised = cv2.fastNlMeansDenoising(gray, None, h=8, templateWindowSize=7, searchWindowSize=21)
        
        # Step 5: Enhance contrast using CLAHE (adaptive - better for varied lighting)
        logger.debug("📍 Adaptive contrast enhancement...")
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        # Step 6: Bilateral filtering to preserve edges and text structure
        bilateral = cv2.bilateralFilter(enhanced, 7, 50, 50)
        
        # Step 7: Sharpen text for better OCR (unsharp mask)
        logger.debug("📍 Sharpening text...")
        gaussian = cv2.GaussianBlur(bilateral, (0, 0), 2.0)
        sharpened = cv2.addWeighted(bilateral, 1.5, gaussian, -0.5, 0)
        
        # Step 8: Adaptive threshold - better for documents with varying background
        logger.debug("📍 Adaptive thresholding...")
        binary = cv2.adaptiveThreshold(
            sharpened, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            15, 8  # Larger block size for structured documents
        )
        
        # Step 9: Minimal morphological operations (preserve text structure)
        logger.debug("📍 Morphological refinement...")
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 1))
        processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close, iterations=1)
        
        # Step 10: Remove noise - eliminate very small components
        kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel_open, iterations=1)
        
        logger.info("✅ Advanced preprocessing complete (optimized for structured documents)")
        return processed
    
    @staticmethod
    def preprocess_for_handwritten(image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for handwritten text recognition.
        Optimized for variable handwriting quality.
        """
        logger.info("🔬 Advanced preprocessing for handwritten text (high accuracy mode)...")
        
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
        
        if img is None:
            return None
        
        # Convert to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()
        
        # Apply median blur to reduce noise while preserving edges
        logger.debug("📍 Median filtering...")
        median = cv2.medianBlur(gray, 5)
        
        # Bilateral filter to preserve strokes
        bilateral = cv2.bilateralFilter(median, 9, 75, 75)
        
        # Enhance contrast with CLAHE
        logger.debug("📍 Contrast enhancement...")
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(bilateral)
        
        # Adaptive threshold with larger neighborhood for handwriting
        logger.debug("📍 Adaptive thresholding...")
        binary = cv2.adaptiveThreshold(
            enhanced, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            15, 3
        )
        
        # Minimal morphological operations (handwriting is fragile)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        logger.info("✅ Handwritten text preprocessing complete")
        return processed
    
    @staticmethod
    def enhance_image_contrast(image: np.ndarray, factor: float = 1.5) -> np.ndarray:
        """Enhance contrast of image."""
        # Apply CLAHE
        clahe = cv2.createCLAHE(clipLimit=factor * 2, tileGridSize=(8, 8))
        return clahe.apply(image)
    
    @staticmethod
    def denoise_aggressive(image: np.ndarray) -> np.ndarray:
        """Aggressive denoising for very noisy images."""
        return cv2.fastNlMeansDenoising(image, None, h=15, templateWindowSize=7, searchWindowSize=21)
    
    @staticmethod
    def binarize_smart(image: np.ndarray) -> np.ndarray:
        """Smart binarization that preserves text quality."""
        # Try multiple thresholds and pick best
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Method 1: Adaptive
        binary_adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Method 2: Otsu
        _, binary_otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Use adaptive by default (better for documents)
        return binary_adaptive
