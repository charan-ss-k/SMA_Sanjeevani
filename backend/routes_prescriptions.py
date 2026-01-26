from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from middleware import get_current_user
from models import Prescription
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new prescription for authenticated user."""
    new_prescription = Prescription(
        user_id=user_id,
        medicine_name=prescription.medicine_name,
        dosage=prescription.dosage,
        frequency=prescription.frequency,
        duration=prescription.duration,
        doctor_name=prescription.doctor_name,
        notes=prescription.notes
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)
    
    return {
        **new_prescription.__dict__,
        'created_at': new_prescription.created_at.isoformat(),
        'updated_at': new_prescription.updated_at.isoformat()
    }

@router.get("/", response_model=List[PrescriptionResponse])
async def get_user_prescriptions(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get all prescriptions for authenticated user."""
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
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific prescription (user can only access their own)."""
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
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update prescription (user can only update their own)."""
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
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete prescription (user can only delete their own)."""
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
