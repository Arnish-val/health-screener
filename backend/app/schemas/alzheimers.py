"""
Pydantic schemas for Alzheimer's disease screening.
"""

from typing import Dict, Optional
from pydantic import BaseModel, Field


class CognitiveResult(BaseModel):
    total_score: int
    max_score: int
    probability_ad: float
    domains: Dict[str, dict]


class FmriResult(BaseModel):
    prediction: str
    probability_ad: float
    decision_score: Optional[float] = None
    n_features_used: int
    source_format: str


class AlzheimersResult(BaseModel):
    combined_risk: float
    risk_level: str
    risk_color: str
    recommendation: str
    cognitive: CognitiveResult
    fmri: Optional[FmriResult] = None
    weights: Dict[str, float]
