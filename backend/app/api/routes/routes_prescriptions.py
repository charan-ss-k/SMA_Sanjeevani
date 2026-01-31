from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user, get_current_user_optional
from app.models.models import Prescription, User
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import tempfile
import cv2

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

class PrescriptionCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    doctor_name: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PrescriptionResponse(BaseModel):
    id: int
    user_id: int
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    doctor_name: str
    notes: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=PrescriptionResponse)
async def create_prescription(
    prescription: PrescriptionCreate,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new prescription for authenticated user."""
    try:
        user_id = user.id
        logger.info(f"Creating prescription for user_id={user_id}: {prescription.medicine_name}")
        
        # If user_id is 0 (anonymous), still allow but log it
        if user_id == 0:
            logger.warning("Creating prescription for anonymous user (user_id=0)")
        
        new_prescription = Prescription(
            user_id=user_id,
            medicine_name=prescription.medicine_name,
            dosage=prescription.dosage,
            frequency=prescription.frequency,
            duration=prescription.duration,
            start_date=datetime.utcnow(),
            doctor_name=prescription.doctor_name,
            notes=prescription.notes
        )
        
        db.add(new_prescription)
        db.commit()
        db.refresh(new_prescription)
        
        logger.info(f"✅ Prescription created successfully: {new_prescription.id}")
        
        return {
            **new_prescription.__dict__,
            'created_at': new_prescription.created_at.isoformat(),
            'updated_at': new_prescription.updated_at.isoformat()
        }
    except HTTPException as http_err:
        logger.error(f"HTTP Error: {http_err.detail}")
        raise
    except Exception as err:
        logger.error(f"❌ Error creating prescription: {str(err)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create prescription: {str(err)}"
        )

@router.get("/", response_model=List[PrescriptionResponse])
async def get_user_prescriptions(
    user = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get all prescriptions for authenticated user."""
    user_id = user.id
    prescriptions = db.query(Prescription).filter(
        Prescription.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    return [
        {
            **p.__dict__,
            'created_at': p.created_at.isoformat(),
            'updated_at': p.updated_at.isoformat()
        } for p in prescriptions
    ]

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific prescription (user can only access their own)."""
    user_id = user.id
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.user_id == user_id
    ).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    return {
        **prescription.__dict__,
        'created_at': prescription.created_at.isoformat(),
        'updated_at': prescription.updated_at.isoformat()
    }

@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: int,
    prescription_update: PrescriptionCreate,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update prescription (user can only update their own)."""
    user_id = user.id
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.user_id == user_id
    ).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    prescription.medicine_name = prescription_update.medicine_name
    prescription.dosage = prescription_update.dosage
    prescription.frequency = prescription_update.frequency
    prescription.duration = prescription_update.duration
    prescription.doctor_name = prescription_update.doctor_name
    prescription.notes = prescription_update.notes
    prescription.updated_at = datetime.utcnow()
    # Ensure start_date remains set
    if not prescription.start_date:
        prescription.start_date = datetime.utcnow()
    
    db.commit()
    db.refresh(prescription)
    
    return {
        **prescription.__dict__,
        'created_at': prescription.created_at.isoformat(),
        'updated_at': prescription.updated_at.isoformat()
    }

@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete prescription (user can only delete their own)."""
    user_id = user.id
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.user_id == user_id
    ).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    db.delete(prescription)
    db.commit()

# AI Medicine Identification Section - Prescription Handwriting Analysis

ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'}
MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_image_file(filename: str) -> bool:
    """Check if file has allowed image extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_handwritten_prescription(
    file: UploadFile = File(...),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Analyze handwritten prescription image using AI.
    
    Workflow:
    1. Preprocess image for handwritten text (adaptive thresholding, denoising)
    2. Recognize text using TrOCR (Microsoft Transformer OCR for handwriting)
    3. Decipher noisy text using Phi-4 LLM with specialized prompt
    4. Extract medicine names, dosages, and frequencies
    
    Returns: Structured list of medicines with dosages and frequencies
    """
    temp_file_path = None
    
    logger.info(f"📥 Received prescription analysis request from user: {user.id if user else 'anonymous'}")
    logger.info(f"📄 File: {file.filename}, Type: {file.content_type}, Size: {file.size}")
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        if not allowed_image_file(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )
        
        # Read and validate file size
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_IMAGE_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max: {MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB"
            )
        
        if file_size < 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too small. Please upload a complete prescription image"
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
        
        # Run prescription analysis (line-based OCR + LLM)
        logger.info("🏥 Starting prescription analysis pipeline...")
        from app.services.handwritten_prescription_analyzer import HandwrittenPrescriptionAnalyzer
        
        result = HandwrittenPrescriptionAnalyzer.analyze_handwritten_prescription(temp_file_path)
        
        # Fail fast on pipeline errors
        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Prescription analysis failed")
            )

        # Add user context to result
        if user and user.id != 0:
            result['user_id'] = user.id
            logger.info(f"Analysis result saved for user {user.id}")
        
        # Log success
        medicines_count = len(result.get('medicines', []))
        logger.info(f"✅ Prescription analysis completed. Found {medicines_count} medicines")
        
        return result
        
    except HTTPException as http_err:
        logger.error(f"HTTP Error: {http_err.detail}")
        raise
    except Exception as err:
        logger.error(f"❌ Error analyzing prescription: {str(err)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription analysis failed: {str(err)}"
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