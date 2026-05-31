"""
Depression screening API route.
Thin layer: validate input → call service → wrap response.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.schemas.depression import DepressionInput, DepressionResult
from app.schemas.common import APIResponse
from app.services.depression_service import predict_depression
from app.core.model_loader import get_mh_artifacts
from app.core.exceptions import ModelNotLoadedError
from app.api import deps
from app.models.user import User
from app.models.history import AssessmentHistory

router = APIRouter(prefix="/predict", tags=["predictions"])


@router.post("/depression", response_model=APIResponse[DepressionResult])
def predict_depression_endpoint(
    data: DepressionInput,
    artifacts: dict = Depends(get_mh_artifacts),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user)
):
    """Screen for depression risk based on demographic and lifestyle metrics."""
    if artifacts["pipeline"] is None:
        raise ModelNotLoadedError("mental_health_pipeline")

    result = predict_depression(
        data=data,
        pipeline=artifacts["pipeline"],
        feature_names=artifacts["features"],
        risk_bands=artifacts["risk_bands"],
    )

    # Save to history if logged in
    if current_user:
        history_record = AssessmentHistory(
            user_id=current_user.id,
            assessment_type="depression",
            result_data=result.model_dump()
        )
        db.add(history_record)
        db.commit()

    return APIResponse[DepressionResult](success=True, data=result)
