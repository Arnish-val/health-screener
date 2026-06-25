"""
Depression screening API route.
Thin layer: validate input → call service → wrap response.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.schemas.depression import (
    DepressionInput,
    DepressionResult,
    StudentDepressionInput,
    ProfessionalDepressionInput,
)
from app.schemas.common import APIResponse
from app.services.depression_service import predict_depression, predict_depression_professional
from app.core.model_loader import (
    get_mh_artifacts,
    get_depression_student_artifacts,
    get_depression_professional_artifacts,
)
from app.core.exceptions import ModelNotLoadedError
from app.api import deps
from app.models.user import User
from app.models.history import AssessmentHistory

router = APIRouter(prefix="/predict", tags=["predictions"])


@router.post("/depression", response_model=APIResponse[DepressionResult])
def predict_depression_endpoint(
    data: DepressionInput,
    artifacts: dict = Depends(get_depression_student_artifacts),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user)
):
    """Legacy route: screen for student depression risk."""
    if artifacts["pipeline"] is None:
        raise ModelNotLoadedError("depression_student_pipeline")

    result = predict_depression(
        data=data,
        pipeline=artifacts["pipeline"],
        feature_names=artifacts["features"],
        risk_bands=artifacts["risk_bands"],
    )

    if current_user:
        history_record = AssessmentHistory(
            user_id=current_user.id,
            assessment_type="depression",
            result_data=result.model_dump()
        )
        db.add(history_record)
        db.commit()

    return APIResponse[DepressionResult](success=True, data=result)


@router.post("/depression/student", response_model=APIResponse[DepressionResult])
def predict_depression_student_endpoint(
    data: StudentDepressionInput,
    artifacts: dict = Depends(get_depression_student_artifacts),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user)
):
    """Screen for student depression risk based on academic, demographic, and lifestyle metrics."""
    if artifacts["pipeline"] is None:
        raise ModelNotLoadedError("depression_student_pipeline")

    result = predict_depression(
        data=data,
        pipeline=artifacts["pipeline"],
        feature_names=artifacts["features"],
        risk_bands=artifacts["risk_bands"],
    )

    if current_user:
        history_record = AssessmentHistory(
            user_id=current_user.id,
            assessment_type="depression_student",
            result_data=result.model_dump()
        )
        db.add(history_record)
        db.commit()

    return APIResponse[DepressionResult](success=True, data=result)


@router.post("/depression/professional", response_model=APIResponse[DepressionResult])
def predict_depression_professional_endpoint(
    data: ProfessionalDepressionInput,
    artifacts: dict = Depends(get_depression_professional_artifacts),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user)
):
    """Screen for working professional depression/burnout risk based on workplace environment and stigma metrics."""
    if artifacts["pipeline"] is None:
        raise ModelNotLoadedError("depression_professional_pipeline")

    result = predict_depression_professional(
        data=data,
        pipeline=artifacts["pipeline"],
        feature_names=artifacts["features"],
        risk_bands=artifacts["risk_bands"],
        encoder=artifacts.get("categorical_encoder", None) or (
            artifacts["pipeline"].named_steps["clf"].get_params().get("categorical_encoder", None)
            if hasattr(artifacts["pipeline"], "named_steps") else None
        ),
        categorical_columns=artifacts.get("categorical_columns", []),
    )

    if current_user:
        history_record = AssessmentHistory(
            user_id=current_user.id,
            assessment_type="depression_professional",
            result_data=result.model_dump()
        )
        db.add(history_record)
        db.commit()

    return APIResponse[DepressionResult](success=True, data=result)

