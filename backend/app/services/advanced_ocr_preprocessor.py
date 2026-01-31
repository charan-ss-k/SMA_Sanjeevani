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
        Multiple techniques for best results.
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
        
        # Step 2: Convert to grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()
        
        # Step 3: Denoise multiple passes
        logger.debug("📍 Denoising...")
        denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # Step 4: Bilateral filtering to preserve edges
        bilateral = cv2.bilateralFilter(denoised, 9, 75, 75)
        
        # Step 5: Enhance contrast using CLAHE
        logger.debug("📍 Contrast enhancement...")
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(10, 10))
        enhanced = clahe.apply(bilateral)
        
        # Step 6: Adaptive threshold for text isolation
        logger.debug("📍 Adaptive thresholding...")
        binary = cv2.adaptiveThreshold(
            enhanced, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        
        # Step 7: Morphological operations - close small holes
        logger.debug("📍 Morphological processing...")
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close, iterations=1)
        
        # Step 8: Erode slightly to separate touching characters
        kernel_erode = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        processed = cv2.morphologyEx(closed, cv2.MORPH_ERODE, kernel_erode, iterations=1)
        
        logger.info("✅ Advanced preprocessing complete")
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
