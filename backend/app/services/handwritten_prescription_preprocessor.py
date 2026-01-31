"""
Handwritten Prescription Image Preprocessor
CNN-based image preprocessing for handwritten prescriptions
"""

import cv2
import numpy as np
import logging
from typing import Tuple, Optional
import imutils

logger = logging.getLogger(__name__)


class HandwrittenPrescriptionPreprocessor:
    """Advanced preprocessing for handwritten prescription images using CNN techniques"""

    def __init__(self):
        self.logger = logger

    def preprocess_for_ocr(self, image_path: str, target_size: Tuple[int, int] = (1920, 1440)) -> np.ndarray:
        """
        Complete preprocessing pipeline for handwritten prescriptions
        
        Args:
            image_path: Path to prescription image
            target_size: Target image dimensions
            
        Returns:
            Preprocessed image suitable for OCR
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")

            self.logger.info("Starting handwritten prescription preprocessing...")

            # Step 1: Resize if too large
            image = self._resize_image(image, target_size)
            self.logger.debug("✓ Image resized")

            # Step 2: Denoise
            denoised = self._denoise(image)
            self.logger.debug("✓ Denoising completed")

            # Step 3: Deskew (correct rotation)
            deskewed = self._deskew(denoised)
            self.logger.debug("✓ Deskewing completed")

            # Step 4: Convert to grayscale
            gray = cv2.cvtColor(deskewed, cv2.COLOR_BGR2GRAY)
            self.logger.debug("✓ Grayscale conversion completed")

            # Step 5: Contrast enhancement (CLAHE)
            enhanced = self._enhance_contrast(gray)
            self.logger.debug("✓ Contrast enhancement completed")

            # Step 6: Adaptive thresholding
            binary = self._adaptive_threshold(enhanced)
            self.logger.debug("✓ Adaptive thresholding completed")

            # Step 7: Morphological operations
            processed = self._morphological_operations(binary)
            self.logger.debug("✓ Morphological operations completed")

            self.logger.info("✅ Preprocessing completed successfully")
            return processed

        except Exception as e:
            self.logger.error(f"Error in preprocessing: {str(e)}")
            raise

    def _resize_image(self, image: np.ndarray, max_size: Tuple[int, int]) -> np.ndarray:
        """Resize image if larger than max_size"""
        height, width = image.shape[:2]

        if width > max_size[0] or height > max_size[1]:
            # Calculate scale to fit within max_size
            scale = min(max_size[0] / width, max_size[1] / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)

        return image

    def _denoise(self, image: np.ndarray) -> np.ndarray:
        """Remove noise from image using multiple techniques"""
        try:
            # Method 1: Non-local means denoising (use positional args for compatibility)
            # Parameters: src, dest, h, hForColorComponents, templateWindowSize, searchWindowSize
            denoised = cv2.fastNlMeansDenoisingColored(
                image,
                None,
                10,  # h (filter strength for luminance)
                10,  # hForColorComponents
                7,   # templateWindowSize
                21   # searchWindowSize
            )
        except cv2.error as e:
            # Fallback for OpenCV version compatibility
            self.logger.warning(f"fastNlMeansDenoisingColored failed: {e}. Using bilateral filter instead.")
            denoised = image

        # Method 2: Bilateral filtering (preserves edges)
        denoised = cv2.bilateralFilter(denoised, 9, 75, 75)

        return denoised

    def _deskew(self, image: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """
        Detect and correct skew in handwritten text
        Uses contour analysis to find rotation angle
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

            # Find contours
            cnts = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnts = imutils.grab_contours(cnts)

            if len(cnts) > 0:
                # Get minimum area rectangle
                c = max(cnts, key=cv2.contourArea)
                rect = cv2.minAreaRect(c)
                angle = rect[-1]

                # Adjust angle
                if angle < -45:
                    angle = 90 + angle

                # If angle is small, no need to rotate
                if abs(angle) > threshold:
                    h, w = image.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    image = cv2.warpAffine(image, M, (w, h), borderMode=cv2.BORDER_REPLICATE)

        except Exception as e:
            self.logger.warning(f"Deskew failed: {str(e)}, continuing without deskew")

        return image

    def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)"""
        # CLAHE for adaptive contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(image)

        return enhanced

    def _adaptive_threshold(self, image: np.ndarray) -> np.ndarray:
        """Apply adaptive thresholding for better text separation"""
        # Adaptive threshold handles varying lighting conditions
        binary = cv2.adaptiveThreshold(
            image,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=11,  # Size of pixel neighborhood
            C=2  # Constant subtracted
        )

        return binary

    def _morphological_operations(self, image: np.ndarray) -> np.ndarray:
        """Apply morphological operations to clean up binary image"""
        # Define kernel
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))

        # Closing (dilation then erosion) - removes small holes
        closed = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel, iterations=1)

        # Opening (erosion then dilation) - removes small noise
        opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel, iterations=1)

        return opened

    def segment_text_regions(self, image: np.ndarray) -> list:
        """
        Detect and segment individual text regions/lines
        Returns list of (x, y, w, h) bounding boxes
        """
        # Find contours
        contours, _ = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            # Filter small regions (noise)
            if w > 10 and h > 10 and w < 1800 and h < 200:
                regions.append((x, y, w, h))

        # Sort by top-to-bottom, left-to-right
        regions = sorted(regions, key=lambda r: (r[1], r[0]))

        self.logger.info(f"Detected {len(regions)} text regions")
        return regions

    def extract_region_image(self, image: np.ndarray, region: Tuple[int, int, int, int]) -> np.ndarray:
        """Extract specific region from image"""
        x, y, w, h = region
        return image[y:y+h, x:x+w]

    def get_image_quality_score(self, image: np.ndarray) -> float:
        """
        Calculate image quality score (0-1)
        Higher score = better quality for OCR
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

        # Calculate Laplacian variance (blur detection)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Normalize to 0-1 scale
        # Low variance = blurry (low score)
        # High variance = sharp (high score)
        quality_score = min(laplacian_var / 500, 1.0)

        return quality_score

    def auto_enhance(self, image: np.ndarray) -> np.ndarray:
        """
        Automatically enhance image quality
        Applies optimal preprocessing based on image characteristics
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Check image quality
        quality = self.get_image_quality_score(image)
        self.logger.info(f"Image quality score: {quality:.2f}")

        # Apply different enhancements based on quality
        if quality < 0.3:
            # Very blurry - aggressive enhancement
            enhanced = cv2.GaussianBlur(gray, (5, 5), 0)
            enhanced = cv2.addWeighted(gray, 1.5, enhanced, -0.5, 0)
        elif quality < 0.6:
            # Slightly blurry - moderate enhancement
            enhanced = cv2.addWeighted(gray, 1.2, cv2.GaussianBlur(gray, (3, 3), 0), -0.2, 0)
        else:
            # Good quality - minimal enhancement
            enhanced = gray

        return enhanced
