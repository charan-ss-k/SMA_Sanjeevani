from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

from app.core.database import get_db
from app.core.middleware import get_current_user
from app.core.rls_context import get_db_with_rls
from app.models.models import HospitalReportHistory, User

router = APIRouter(prefix="/api/hospital-report-history", tags=["Hospital Report History"])


class HospitalReportHistoryCreate(BaseModel):
    report_title: Optional[str] = None
    uploaded_file: Optional[str] = None
    ocr_method: Optional[str] = None
    extracted_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None


class HospitalReportHistoryResponse(BaseModel):
    id: int
    user_id: int
    report_title: Optional[str]
    uploaded_file: Optional[str]
    ocr_method: Optional[str]
    extracted_text: Optional[str]
    structured_data: Optional[Dict[str, Any]]
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=HospitalReportHistoryResponse)
async def create_hospital_report_history(
    payload: HospitalReportHistoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a hospital report analysis to history."""
    db = get_db_with_rls(db, user.id)
    new_history = HospitalReportHistory(
        user_id=user.id,
        report_title=payload.report_title,
        uploaded_file=payload.uploaded_file,
        ocr_method=payload.ocr_method,
        extracted_text=payload.extracted_text,
        structured_data=payload.structured_data
    )

    db.add(new_history)
    db.commit()
    db.refresh(new_history)

    return {
        **new_history.__dict__,
        "created_at": new_history.created_at.isoformat()
    }


@router.get("/", response_model=List[HospitalReportHistoryResponse])
async def get_hospital_report_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Get hospital report history for current user."""
    db = get_db_with_rls(db, user.id)
    histories = db.query(HospitalReportHistory).filter(
        HospitalReportHistory.user_id == user.id
    ).order_by(HospitalReportHistory.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            **h.__dict__,
            "created_at": h.created_at.isoformat()
        }
        for h in histories
    ]


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospital_report_history(
    history_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a hospital report history entry (user can only delete their own)."""
    db = get_db_with_rls(db, user.id)
    history = db.query(HospitalReportHistory).filter(
        HospitalReportHistory.id == history_id,
        HospitalReportHistory.user_id == user.id
    ).first()

    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital report history not found"
        )

    db.delete(history)
    db.commit()
