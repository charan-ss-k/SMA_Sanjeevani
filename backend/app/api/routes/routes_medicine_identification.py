"""
API routes for medicine identification from images
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from fastapi.responses import JSONResponse
import logging
import os
import tempfile
import shutil
from typing import Optional
from sqlalchemy.orm import Session
import cv2
import numpy as np

from app.core.database import get_db
from app.core.middleware import get_current_user, get_current_user_optional
from app.services.medicine_ocr_service import process_medicine_image
from app.models.models import Prescription, MedicineHistory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/medicine-identification", tags=["medicine-identification"])

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename: str) -> bool:
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@router.post("/analyze")
async def analyze_medicine_image(
    file: UploadFile = File(...),
    user_id: Optional[int] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Analyze medicine image using OCR + Phi-4.
    
    Upload a clear image of:
    - Medicine tablet/capsule
    - Medicine strip/blister pack
    - Medicine box/bottle
    - Prescription
    
    Returns medicine details: dosage, precautions, food interaction, age restrictions, etc.
    """
    temp_file_path = None
    
    logger.info(f"📥 Received medicine identification request from user: {user_id}")
    logger.info(f"📄 File: {file.filename}, Type: {file.content_type}, Size: {file.size}")
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        if not allowed_file(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        file_size = 0
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        if file_size < 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too small. Please upload a complete image"
            )
        
        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as tmp:
            tmp.write(file_content)
            temp_file_path = tmp.name
        
        # Verify it's a valid image
        image = cv2.imread(temp_file_path)
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file. Please upload a valid image"
            )
        
        # Process image
        logger.info(f"Processing medicine image for user {user_id}")
        result = await process_medicine_image(temp_file_path)
        
        # Return properly formatted response
        if result.get('success'):
            # If user is authenticated, store a brief medicine history entry for analytics
            try:
                if user_id:
                    analysis = result.get('analysis', {}) or {}
                    mh = MedicineHistory(
                        user_id=user_id,
                        symptoms=[],
                        predicted_condition=analysis.get('medicine_name', 'identified'),
                        recommended_medicines=[{
                            'medicine_name': analysis.get('medicine_name'),
                            'sections': analysis.get('sections')
                        }],
                        home_care_advice=None,
                        dosage_info=analysis.get('dosage') if analysis.get('dosage') else None
                    )
                    db.add(mh)
                    db.commit()
                    db.refresh(mh)
            except Exception as e:
                logger.warning(f"Failed to record medicine history for user {user_id}: {e}")

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "analysis": result.get('analysis', {}),
                    "ocr_text": result.get('ocr_text', ''),
                    "message": "Medicine identification successful"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get('error', 'Failed to identify medicine')
            )
        
    except HTTPException as e:
        logger.error(f"HTTP Error: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )
    finally:
        # Cleanup
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {e}")


@router.post("/save-to-prescription")
async def save_to_prescription(
    medicine_data: dict,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save identified medicine to user's prescriptions.
    
    Expects JSON with:
    {
        "medicine_name": str,
        "dosage": str,
        "frequency": str,
        "duration": str,
        "notes": str (optional)
    }
    """
    try:
        prescription = Prescription(
            user_id=user_id,
            medicine_name=medicine_data.get("medicine_name", "Unknown"),
            dosage=medicine_data.get("dosage", ""),
            frequency=medicine_data.get("frequency", ""),
            duration=medicine_data.get("duration", ""),
            doctor_name="Image Analysis",
            notes=medicine_data.get("notes", "Identified from medicine image")
        )
        
        db.add(prescription)
        db.commit()
        db.refresh(prescription)
        
        return {
            "success": True,
            "message": "Medicine saved to prescriptions",
            "prescription_id": prescription.id
        }
        
    except Exception as e:
        logger.error(f"Error saving prescription: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving prescription: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Check if medicine identification service is available"""
    try:
        # Try importing required libraries
        import cv2
        import pytesseract
        
        return {
            "status": "healthy",
            "service": "medicine-identification",
            "components": {
                "opencv": "available",
                "pytesseract": "available",
                "easyocr": "available (optional)"
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "medicine-identification",
            "error": str(e)
        }
