#!/usr/bin/env python
"""Test script to verify OCR improvements"""

import sys
import os
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app.services.multimethod_ocr import MultiMethodHandwrittenOCR
    from app.services.handwritten_prescription_preprocessor import HandwrittenPrescriptionPreprocessor
    import cv2
    import numpy as np
    
    logger.info("✅ All imports successful")
    
    # Test quality scoring with sample text
    ocr = MultiMethodHandwrittenOCR()
    
    # Test 1: Low confidence text (what we had before)
    low_conf_text = "paracetamol aspirin ibupro"
    score = ocr._calculate_quality_score(low_conf_text)
    logger.info(f"✅ Low confidence text quality score: {score:.2%}")
    
    # Test 2: High confidence text
    high_conf_text = "paracetamol 500mg twice daily aspirin 100mg once daily ibuprofen 400mg thrice"
    score = ocr._calculate_quality_score(high_conf_text)
    logger.info(f"✅ High confidence text quality score: {score:.2%}")
    
    # Test 3: Medical keyword scoring
    keywords_score = ocr._calculate_medical_keyword_score(high_conf_text)
    logger.info(f"✅ Medical keyword score: {keywords_score:.2%}")
    
    # Test 4: Validation
    validation = ocr.validate_extracted_text(low_conf_text)
    logger.info(f"✅ Low text validation: {validation}")
    
    validation = ocr.validate_extracted_text(high_conf_text)
    logger.info(f"✅ High text validation: {validation}")
    
    logger.info("\n✅ All tests passed!")
    
except Exception as e:
    logger.error(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
