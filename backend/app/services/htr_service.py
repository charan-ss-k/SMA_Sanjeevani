"""
Handwritten Text Recognition (HTR) Service using TrOCR
Uses Microsoft's TrOCR model for accurate handwritten prescription text recognition
"""

import logging
import numpy as np
from typing import Optional
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Lazy loading - only import transformers when actually needed
_htr_model = None
_htr_processor = None


class HTRService:
    """
    Handwritten Text Recognition using Microsoft TrOCR.
    Specifically trained on handwritten documents.
    """
    
    MODEL_NAME = "microsoft/trocr-base-handwritten"
    
    @staticmethod
    def _load_model():
        """
        Lazy load TrOCR model and processor.
        Only loads on first use to avoid startup delays.
        """
        global _htr_model, _htr_processor
        
        if _htr_model is not None and _htr_processor is not None:
            return _htr_model, _htr_processor
        
        logger.info(f"Loading TrOCR model: {HTRService.MODEL_NAME}")
        
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            
            # Load processor
            processor = TrOCRProcessor.from_pretrained(HTRService.MODEL_NAME)
            logger.info("✅ TrOCRProcessor loaded")
            
            # Load model
            model = VisionEncoderDecoderModel.from_pretrained(HTRService.MODEL_NAME)
            logger.info(f"✅ TrOCR model loaded: {HTRService.MODEL_NAME}")
            
            _htr_model = model
            _htr_processor = processor
            
            return model, processor
            
        except ImportError as e:
            logger.error(f"Failed to import transformers: {e}")
            raise RuntimeError(
                "transformers library not installed. "
                "Install with: pip install transformers torch"
            )
        except Exception as e:
            logger.error(f"Failed to load TrOCR model: {e}")
            raise RuntimeError(f"Could not load TrOCR model: {e}")
    
    @staticmethod
    def recognize_text(image_array: np.ndarray, max_retries: int = 3) -> str:
        """
        Recognize handwritten text from a preprocessed image array.
        
        Args:
            image_array: Preprocessed image as numpy array (RGB or grayscale)
            max_retries: Number of retries on inference failure
            
        Returns:
            Recognized text string
            
        Raises:
            RuntimeError: If recognition fails after retries
        """
        logger.info("Starting handwritten text recognition with TrOCR...")
        
        # Load model
        model, processor = HTRService._load_model()
        
        # Convert numpy array to PIL Image
        pil_image = HTRService._array_to_pil_image(image_array)
        
        # Try recognition with retries
        last_error = None
        for attempt in range(max_retries):
            try:
                logger.debug(f"Recognition attempt {attempt + 1}/{max_retries}")
                
                # Process image
                pixel_values = processor(
                    images=pil_image,
                    return_tensors="pt"
                ).pixel_values
                logger.debug(f"Image processed. Pixel values shape: {pixel_values.shape}")
                
                # Generate text with reduced token length for prescriptions
                generated_ids = model.generate(pixel_values, max_length=128)
                logger.debug(f"Generated IDs: {generated_ids}")
                
                # Decode to text
                generated_text = processor.batch_decode(
                    generated_ids,
                    skip_special_tokens=True
                )[0]
                
                logger.info(f"✅ Text recognized successfully")
                logger.debug(f"Recognized text: {generated_text}")
                
                return generated_text
                
            except Exception as e:
                last_error = e
                logger.warning(f"Recognition attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    logger.info(f"Retrying... ({attempt + 2}/{max_retries})")
                    continue
        
        # All retries failed
        logger.error(f"Text recognition failed after {max_retries} attempts")
        raise RuntimeError(
            f"Handwritten text recognition failed: {last_error}"
        )
    
    @staticmethod
    def _array_to_pil_image(image_array: np.ndarray) -> Image.Image:
        """
        Convert numpy array to PIL Image.
        Handles both grayscale and RGB images.
        """
        logger.debug(f"Converting image array to PIL. Shape: {image_array.shape}, dtype: {image_array.dtype}")
        
        # Ensure image is in uint8 format
        if image_array.dtype != np.uint8:
            if image_array.max() <= 1.0:
                # Float image in [0, 1] range
                image_array = (image_array * 255).astype(np.uint8)
            else:
                # Float image in [0, 255] range or other uint types
                image_array = image_array.astype(np.uint8)
        
        # Handle different image formats
        if len(image_array.shape) == 2:
            # Grayscale image -> convert to RGB
            logger.debug("Converting grayscale to RGB")
            pil_image = Image.fromarray(image_array, mode='L').convert('RGB')
        elif len(image_array.shape) == 3:
            if image_array.shape[2] == 3:
                # BGR to RGB conversion
                image_rgb = image_array[:, :, ::-1]  # BGR -> RGB
                pil_image = Image.fromarray(image_rgb, mode='RGB')
            elif image_array.shape[2] == 4:
                # BGRA to RGB
                image_rgb = image_array[:, :, :3][:, :, ::-1]
                pil_image = Image.fromarray(image_rgb, mode='RGB')
            else:
                raise ValueError(f"Unsupported image shape: {image_array.shape}")
        else:
            raise ValueError(f"Unsupported image array shape: {image_array.shape}")
        
        logger.debug(f"PIL Image created. Size: {pil_image.size}, Mode: {pil_image.mode}")
        return pil_image
    
    @staticmethod
    def recognize_text_from_file(image_path: str) -> str:
        """
        Recognize handwritten text directly from image file.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Recognized text string
        """
        logger.info(f"Loading image from file: {image_path}")
        
        # Load image
        image = Image.open(image_path).convert('RGB')
        image_array = np.array(image)
        
        return HTRService.recognize_text(image_array)
    
    @staticmethod
    def get_model_info() -> dict:
        """Get information about the loaded model."""
        return {
            "model_name": HTRService.MODEL_NAME,
            "description": "Microsoft TrOCR for handwritten text recognition",
            "model_loaded": _htr_model is not None,
            "framework": "Transformers + PyTorch"
        }
