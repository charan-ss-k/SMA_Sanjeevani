"""
API Routes for Hospital Report Analysis
Separate endpoint from handwritten prescription analysis
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from typing import Dict, Any
import logging
import tempfile
import cv2

from app.core.middleware import get_current_user_optional
from app.models.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hospital-reports", tags=["Hospital Reports"])

# File upload constraints
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.pdf'}


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_hospital_report(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user_optional)
):
    """
    Analyze a typed/printed hospital report image.
    
    Extracts structured information:
    - Hospital details
    - Patient information
    - Doctor details
    - Complete medicine list
    - Investigations/tests
    - Medical advice
    
    Args:
        file: Hospital report image file
        user: Optional authenticated user
        
    Returns:
        Structured hospital report data with all extracted fields
    """
    temp_file_path = None
    
    try:
        # Log request
        user_id = user.username if user else "anonymous"
        logger.info(f"📥 Received hospital report analysis request from user: {user_id}")
        logger.info(f"📄 File: {file.filename}, Type: {file.content_type}, Size: {file.size if hasattr(file, 'size') else 'unknown'}")
        
        # Validate file type
        if not allowed_file(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        if file_size < 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too small. Please upload a complete hospital report image"
            )
        
        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as tmp:
            tmp.write(file_content)
            temp_file_path = tmp.name
        
        logger.debug(f"Temporary file saved: {temp_file_path}")
        
        # Verify it's a valid image
        image = cv2.imread(temp_file_path)
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file. Please upload a valid image"
            )
        
        logger.debug(f"Image validated. Size: {image.shape}")
        
        # Run hospital report analysis
        logger.info("🏥 Starting hospital report analysis pipeline...")
        from app.services.hospital_report_analyzer import HospitalReportAnalyzer
        
        result = HospitalReportAnalyzer.analyze_hospital_report(temp_file_path)
        
        # Add user context
        if user and user.id != 0:
            result['user_id'] = user.id
            logger.info(f"Analysis result saved for user {user.id}")
        
        # Check for errors
        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Hospital report analysis failed")
            )
        
        # Log success
        medicines_count = len(result.get('structured_data', {}).get('medicines', []))
        logger.info(f"✅ Hospital report analysis completed. Found {medicines_count} medicines")
        
        return result
        
    except HTTPException as http_err:
        logger.error(f"HTTP Error: {http_err.detail}")
        raise
    except Exception as err:
        logger.error(f"❌ Error analyzing hospital report: {str(err)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hospital report analysis failed: {str(err)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path:
            import os
            try:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    logger.debug(f"Temporary file cleaned up: {temp_file_path}")
            except Exception as cleanup_err:
                logger.warning(f"Failed to clean up temporary file: {cleanup_err}")


@router.get("/info")
async def get_service_info():
    """
    Get information about the hospital report analysis service.
    
    Returns:
        Service capabilities and supported features
    """
    from app.services.hospital_report_analyzer import HospitalReportAnalyzer
    return HospitalReportAnalyzer.get_service_info()


@router.get("/health")
async def health_check():
    """
    Health check endpoint for hospital report analysis service.
    
    Returns:
        Service status and available OCR engines
    """
    try:
        import pytesseract
        tesseract_available = True
    except:
        tesseract_available = False
    
    try:
        import easyocr
        easyocr_available = True
    except:
        easyocr_available = False
    
    return {
        "status": "healthy" if (tesseract_available or easyocr_available) else "degraded",
        "service": "Hospital Report Analyzer",
        "ocr_engines": {
            "tesseract": tesseract_available,
            "easyocr": easyocr_available
        },
        "message": "At least one OCR engine is required" if not (tesseract_available or easyocr_available) else "Service operational"
    }
