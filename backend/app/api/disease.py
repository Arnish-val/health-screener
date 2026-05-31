"""
Disease prediction API route.
Thin layer: validate input → call service → wrap response.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.schemas.disease import DiseaseInput, DiseaseResult
from app.schemas.common import APIResponse
from app.services.disease_service import predict_disease
from app.core.model_loader import get_disease_artifacts
from app.core.exceptions import ModelNotLoadedError
from app.api import deps
from app.models.user import User
from app.models.history import AssessmentHistory

router = APIRouter(prefix="/predict", tags=["predictions"])


@router.post("/disease", response_model=APIResponse[DiseaseResult])
def predict_disease_endpoint(
    data: DiseaseInput,
    artifacts: dict = Depends(get_disease_artifacts),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user)
):
    """Predict top-3 most probable diseases from symptom input."""
    if artifacts["pipeline"] is None:
        raise ModelNotLoadedError("disease_pipeline")

    result = predict_disease(
        symptoms=data.symptoms,
        pipeline=artifacts["pipeline"],
        label_encoder=artifacts["label_encoder"],
        feature_names=artifacts["features"],
    )

    # Save to history if logged in
    if current_user:
        history_record = AssessmentHistory(
            user_id=current_user.id,
            assessment_type="disease",
            result_data=result.model_dump()
        )
        db.add(history_record)
        db.commit()

    return APIResponse[DiseaseResult](success=True, data=result)
