"""
Image Preprocessing Pipeline for Handwritten Prescription Analysis
Optimized for making handwritten text as clear as possible before HTR
"""

import cv2
import numpy as np
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


class PrescriptionImagePreprocessor:
    """
    Specialized image preprocessing for handwritten prescriptions.
    Applies aggressive filters designed specifically for doctor's handwriting.
    """
    
    @staticmethod
    def preprocess(image_path: str) -> np.ndarray:
        """
        Apply complete preprocessing pipeline to prescription image.
        
        Steps:
        1. Load image
        2. Convert to grayscale
        3. Denoise
        4. Apply adaptive thresholding
        5. Apply morphological operations
        6. Deskew (optional)
        
        Args:
            image_path: Path to prescription image file
            
        Returns:
            Preprocessed image as numpy array
        """
        logger.info(f"Starting preprocessing for prescription image: {image_path}")
        
        # Step 1: Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        logger.debug(f"Image loaded. Shape: {image.shape}")
        
        # Step 2: Convert to grayscale
        gray = PrescriptionImagePreprocessor._to_grayscale(image)
        
        # Step 3: Denoise
        denoised = PrescriptionImagePreprocessor._denoise(gray)
        
        # Step 4: Apply adaptive thresholding
        thresholded = PrescriptionImagePreprocessor._adaptive_threshold(denoised)
        
        # Step 5: Apply morphological operations
        morphed = PrescriptionImagePreprocessor._apply_morphology(thresholded)
        
        # Step 6: Optional deskewing (can help with scanned documents)
        # Note: Only apply if angle is significant
        final = PrescriptionImagePreprocessor._deskew(morphed)
        
        logger.info("Preprocessing complete")
        return final
    
    @staticmethod
    def _to_grayscale(image: np.ndarray) -> np.ndarray:
        """Convert color image to grayscale."""
        logger.debug("Converting to grayscale...")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return gray
    
    @staticmethod
    def _denoise(gray: np.ndarray) -> np.ndarray:
        """
        Remove noise while preserving edges.
        Uses bilateral filter for edge-preserving smoothing.
        """
        logger.debug("Denoising image...")
        # Bilateral filter: excellent for noise removal while keeping edges sharp
        denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
        
        # Additional morphological opening to remove small noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        denoised = cv2.morphologyEx(denoised, cv2.MORPH_OPEN, kernel, iterations=1)
        
        return denoised
    
    @staticmethod
    def _adaptive_threshold(image: np.ndarray) -> np.ndarray:
        """
        Apply adaptive thresholding for varying light conditions.
        This is crucial for handwritten text as pen pressure varies.
        """
        logger.debug("Applying adaptive thresholding...")
        # Adaptive thresholding with larger block size for prescription documents
        thresholded = cv2.adaptiveThreshold(
            image,
            maxValue=255,
            adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            thresholdType=cv2.THRESH_BINARY,
            blockSize=21,  # Odd number for better results
            C=5  # Constant subtracted from mean
        )
        return thresholded
    
    @staticmethod
    def _apply_morphology(binary_image: np.ndarray) -> np.ndarray:
        """
        Apply morphological operations to enhance handwritten strokes.
        Dilation makes pen strokes thicker for better OCR recognition.
        """
        logger.debug("Applying morphological operations...")
        
        # Create kernels for morphological operations
        small_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        medium_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        # Close small holes in text
        closed = cv2.morphologyEx(binary_image, cv2.MORPH_CLOSE, small_kernel, iterations=1)
        
        # Dilate to strengthen pen strokes
        dilated = cv2.dilate(closed, medium_kernel, iterations=1)
        
        # Optional: thin strokes that became too thick
        # Apply closing to ensure strokes are continuous
        final = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, small_kernel, iterations=1)
        
        return final
    
    @staticmethod
    def _deskew(image: np.ndarray) -> np.ndarray:
        """
        Detect and correct skew in prescription image.
        Important for scanned documents and phone-captured images.
        """
        logger.debug("Checking for skew and deskewing if needed...")
        
        try:
            # Find contours to detect main text areas
            contours, _ = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if len(contours) == 0:
                logger.debug("No contours found, skipping deskew")
                return image
            
            # Get the largest contour
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Get bounding rectangle
            rect = cv2.minAreaRect(largest_contour)
            angle = rect[2]
            
            # Only deskew if angle is significant (> 2 degrees)
            if abs(angle) > 2:
                logger.debug(f"Detected skew angle: {angle}°. Deskewing...")
                
                # Get image dimensions
                h, w = image.shape
                center = (w // 2, h // 2)
                
                # Get rotation matrix
                rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                
                # Apply rotation
                deskewed = cv2.warpAffine(
                    image,
                    rotation_matrix,
                    (w, h),
                    borderMode=cv2.BORDER_CONSTANT,
                    borderValue=255  # White background
                )
                
                return deskewed
            else:
                logger.debug(f"Skew angle too small ({angle}°), no correction needed")
                return image
                
        except Exception as e:
            logger.warning(f"Deskew failed: {e}. Using original image.")
            return image
    
    @staticmethod
    def get_preprocessed_for_htr(image_path: str) -> np.ndarray:
        """
        Convenience method: preprocess and ensure output is ready for TrOCR.
        TrOCR expects RGB images in the range [0, 255].
        """
        # Preprocess
        preprocessed = PrescriptionImagePreprocessor.preprocess(image_path)
        
        # Convert binary (0-255) to RGB if needed
        if len(preprocessed.shape) == 2:
            # Binary/grayscale -> convert to RGB by repeating channels
            rgb_image = cv2.cvtColor(preprocessed, cv2.COLOR_GRAY2BGR)
        else:
            rgb_image = preprocessed
        
        logger.debug(f"HTR-ready image shape: {rgb_image.shape}, dtype: {rgb_image.dtype}")
        return rgb_image
