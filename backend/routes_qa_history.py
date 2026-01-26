from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from middleware import get_current_user
from models import QAHistory
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/qa-history", tags=["qa-history"])

class QAHistoryCreate(BaseModel):
    question: str
    answer: str
    category: str  # Medicine, Symptoms, Prescription, General
    helpful: Optional[bool] = None
    follow_up_questions: Optional[str] = None

    class Config:
        from_attributes = True

class QAHistoryResponse(BaseModel):
    id: int
    user_id: int
    question: str
    answer: str
    category: str
    helpful: Optional[bool]
    follow_up_questions: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=QAHistoryResponse)
async def create_qa_history(
    qa_data: QAHistoryCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new Q&A history entry for authenticated user."""
    new_qa = QAHistory(
        user_id=user_id,
        question=qa_data.question,
        answer=qa_data.answer,
        category=qa_data.category,
        helpful=qa_data.helpful,
        follow_up_questions=qa_data.follow_up_questions
    )
    db.add(new_qa)
    db.commit()
    db.refresh(new_qa)
    
    return {
        **new_qa.__dict__,
        'created_at': new_qa.created_at.isoformat()
    }

@router.get("/", response_model=List[QAHistoryResponse])
async def get_user_qa_history(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None
):
    """Get Q&A history for authenticated user, optionally filtered by category."""
    query = db.query(QAHistory).filter(QAHistory.user_id == user_id)
    
    if category:
        query = query.filter(QAHistory.category == category)
    
    # Order by created_at ascending (oldest first) to maintain conversation order
    qa_history = query.order_by(QAHistory.created_at.asc()).offset(skip).limit(limit).all()
    
    return [
        {
            **qa.__dict__,
            'created_at': qa.created_at.isoformat()
        } for qa in qa_history
    ]

@router.get("/{qa_id}", response_model=QAHistoryResponse)
async def get_qa_history(
    qa_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific Q&A history entry (user can only access their own)."""
    qa = db.query(QAHistory).filter(
        QAHistory.id == qa_id,
        QAHistory.user_id == user_id
    ).first()
    
    if not qa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Q&A history not found"
        )
    
    return {
        **qa.__dict__,
        'created_at': qa.created_at.isoformat()
    }

@router.put("/{qa_id}/helpful")
async def mark_qa_helpful(
    qa_id: int,
    helpful: bool,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark Q&A as helpful or not helpful."""
    qa = db.query(QAHistory).filter(
        QAHistory.id == qa_id,
        QAHistory.user_id == user_id
    ).first()
    
    if not qa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Q&A history not found"
        )
    
    qa.helpful = helpful
    db.commit()
    
    return {
        "message": "Feedback recorded",
        "helpful": helpful
    }

@router.delete("/{qa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_qa_history(
    qa_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete Q&A history entry (user can only delete their own)."""
    qa = db.query(QAHistory).filter(
        QAHistory.id == qa_id,
        QAHistory.user_id == user_id
    ).first()
    
    if not qa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Q&A history not found"
        )
    
    db.delete(qa)
    db.commit()
