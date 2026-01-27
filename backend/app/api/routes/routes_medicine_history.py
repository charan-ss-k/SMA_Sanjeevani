from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user
from app.models.models import MedicineHistory
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/medicine-history", tags=["medicine-history"])

class MedicineHistoryCreate(BaseModel):
    symptoms: str
    predicted_condition: str
    medicines: str
    dosages: str
    feedback: Optional[str] = None
    rating: Optional[int] = None

    class Config:
        from_attributes = True

class MedicineHistoryResponse(BaseModel):
    id: int
    user_id: int
    symptoms: str
    predicted_condition: str
    medicines: str
    dosages: str
    feedback: Optional[str]
    rating: Optional[int]
    created_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=MedicineHistoryResponse)
async def create_medicine_history(
    history: MedicineHistoryCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new medicine recommendation history entry for authenticated user."""
    new_history = MedicineHistory(
        user_id=user_id,
        symptoms=history.symptoms,
        predicted_condition=history.predicted_condition,
        medicines=history.medicines,
        dosages=history.dosages,
        feedback=history.feedback,
        rating=history.rating
    )
    db.add(new_history)
    db.commit()
    db.refresh(new_history)
    
    return {
        **new_history.__dict__,
        'created_at': new_history.created_at.isoformat()
    }

@router.get("/", response_model=List[MedicineHistoryResponse])
async def get_user_medicine_history(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get all medicine recommendation history for authenticated user."""
    histories = db.query(MedicineHistory).filter(
        MedicineHistory.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    return [
        {
            **h.__dict__,
            'created_at': h.created_at.isoformat()
        } for h in histories
    ]

@router.get("/{history_id}", response_model=MedicineHistoryResponse)
async def get_medicine_history(
    history_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific medicine history entry (user can only access their own)."""
    history = db.query(MedicineHistory).filter(
        MedicineHistory.id == history_id,
        MedicineHistory.user_id == user_id
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine history not found"
        )
    
    return {
        **history.__dict__,
        'created_at': history.created_at.isoformat()
    }

@router.put("/{history_id}", response_model=MedicineHistoryResponse)
async def update_medicine_history(
    history_id: int,
    history_update: MedicineHistoryCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update medicine history entry (user can only update their own)."""
    history = db.query(MedicineHistory).filter(
        MedicineHistory.id == history_id,
        MedicineHistory.user_id == user_id
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine history not found"
        )
    
    history.symptoms = history_update.symptoms
    history.predicted_condition = history_update.predicted_condition
    history.medicines = history_update.medicines
    history.dosages = history_update.dosages
    history.feedback = history_update.feedback
    history.rating = history_update.rating
    
    db.commit()
    db.refresh(history)
    
    return {
        **history.__dict__,
        'created_at': history.created_at.isoformat()
    }

@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine_history(
    history_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete medicine history entry (user can only delete their own)."""
    history = db.query(MedicineHistory).filter(
        MedicineHistory.id == history_id,
        MedicineHistory.user_id == user_id
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine history not found"
        )
    
    db.delete(history)
    db.commit()
