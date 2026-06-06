"""
Alzheimer's disease screening API route.
Accepts cognitive scores plus an optional raw DICOM/NIfTI upload.
"""

import json
import shutil
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.api import deps
from app.core.exceptions import ModelNotLoadedError, ValidationError
from app.core.model_loader import get_alz_artifacts
from app.models.history import AssessmentHistory
from app.models.user import User
from app.schemas.alzheimers import AlzheimersResult
from app.schemas.common import APIResponse
from app.services.alzheimers_service import predict_alzheimers

router = APIRouter(prefix="/predict", tags=["predictions"])


@router.post("/alzheimers", response_model=APIResponse[AlzheimersResult])
def predict_alzheimers_endpoint(
    cognitive_scores: str = Form(...),
    scan_file: Optional[UploadFile] = File(None),
    artifacts: dict = Depends(get_alz_artifacts),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user),
):
    """Predict AD/CN from raw scan upload and cognitive scores."""
    try:
        parsed_scores = json.loads(cognitive_scores)
    except json.JSONDecodeError as exc:
        raise ValidationError("cognitive_scores must be valid JSON.") from exc

    if not isinstance(parsed_scores, dict):
        raise ValidationError("cognitive_scores must be an object of domain scores.")

    if scan_file is not None and artifacts["model"] is None:
        raise ModelNotLoadedError("alzheimers_ad_cn_model")

    upload_path = None
    with tempfile.TemporaryDirectory(prefix="alz_request_") as tmp:
        if scan_file is not None:
            filename = Path(scan_file.filename or "scan_upload").name
            upload_path = Path(tmp) / filename
            with upload_path.open("wb") as out:
                shutil.copyfileobj(scan_file.file, out)

        result = predict_alzheimers(
            upload_path=upload_path,
            cognitive_scores=parsed_scores,
            model=artifacts["model"],
            scaler=artifacts.get("scaler"),
        )

    if current_user:
        history_record = AssessmentHistory(
            user_id=current_user.id,
            assessment_type="alzheimers",
            result_data=result.model_dump(),
        )
        db.add(history_record)
        db.commit()

    return APIResponse[AlzheimersResult](success=True, data=result)
