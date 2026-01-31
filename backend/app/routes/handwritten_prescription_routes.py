"""
API routes for handwritten prescription analysis
Complete proper line-based TrOCR + LLM deciphering pipeline
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
import logging
import io

from app.services.handwritten_prescription_analyzer import HandwrittenPrescriptionAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prescription", tags=["prescription"])


@router.post("/analyze-handwritten")
async def analyze_handwritten_prescription(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyze handwritten prescription image.
    
    Complete pipeline:
    1. Extract text using line-based TrOCR OCR
    2. Decipher with LLM for medicine extraction
    3. Return structured medicine list
    
    Args:
        file: Prescription image file (JPG, PNG, etc.)
    
    Returns:
        Dictionary with recognized medicines and metadata
    """
    logger.info(f"📥 Received prescription upload: {file.filename}")
    
    try:
        # Validate file type
        allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
        file_ext = "." + (file.filename.split(".")[-1] if "." in file.filename else "").lower()
        
        if file_ext not in allowed_extensions:
            logger.warning(f"❌ Invalid file type: {file_ext}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        content = await file.read()
        
        if not content:
            logger.warning("❌ Empty file uploaded")
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if len(content) > 10 * 1024 * 1024:  # 10 MB limit
            logger.warning("❌ File too large")
            raise HTTPException(status_code=413, detail="File too large (max 10 MB)")
        
        # Analyze prescription
        logger.info(f"🏥 Starting prescription analysis for {file.filename}")
        result = HandwrittenPrescriptionAnalyzer.analyze_handwritten_prescription_from_bytes(
            content,
            file.filename
        )
        
        logger.info(f"✅ Analysis complete. Status: {result['status']}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error analyzing prescription: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze prescription: {str(e)}"
        )


@router.get("/service-info")
async def get_prescription_service_info() -> Dict[str, Any]:
    """Get information about the prescription analysis service."""
    logger.info("📋 Fetching prescription service information")
    return HandwrittenPrescriptionAnalyzer.get_service_info()


@router.get("/ocr-capabilities")
async def get_ocr_capabilities() -> Dict[str, Any]:
    """Get OCR capabilities and configuration."""
    from app.services.handwritten_prescription_ocr import (
        HAVE_TROCR, HAVE_CRAFT, HandwrittenPrescriptionOCR
    )
    
    return {
        "service": "Handwritten Prescription OCR",
        "ocr_system": {
            "type": "Line-based TrOCR with text detection",
            "trocr_available": HAVE_TROCR,
            "craft_available": HAVE_CRAFT,
            "fallback": "Contour-based text detection if CRAFT unavailable"
        },
        "pipeline": [
            "Image Normalization",
            "Text Line Detection",
            "Crop Extraction",
            "Per-Crop Preprocessing",
            "TrOCR on Each Line",
            "Sorting by Y Coordinate",
            "Text Merging"
        ],
        "supported_formats": ["jpg", "jpeg", "png", "bmp", "tiff"],
        "max_file_size_mb": 10,
        "detailed_info": HandwrittenPrescriptionOCR.get_service_info()
    }
