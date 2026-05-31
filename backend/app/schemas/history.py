from pydantic import BaseModel
from typing import Any, Dict
from datetime import datetime

class AssessmentHistoryOut(BaseModel):
    id: int
    assessment_type: str
    result_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
