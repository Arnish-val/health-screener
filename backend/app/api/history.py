from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.api import deps
from app.models.user import User
from app.models.history import AssessmentHistory
from app.schemas.history import AssessmentHistoryOut
from app.schemas.common import APIResponse

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/", response_model=APIResponse[List[AssessmentHistoryOut]])
def get_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get the assessment history for the currently logged-in user.
    """
    history_records = db.query(AssessmentHistory)\
        .filter(AssessmentHistory.user_id == current_user.id)\
        .order_by(AssessmentHistory.created_at.desc())\
        .all()
    
    return APIResponse(
        success=True,
        data=[AssessmentHistoryOut.model_validate(r) for r in history_records]
    )
