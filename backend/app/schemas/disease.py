"""
Pydantic schemas for the disease prediction endpoint.
"""

from typing import Dict, List
from pydantic import BaseModel


class DiseaseInput(BaseModel):
    """Request body: dictionary of symptom_name → 0 or 1."""
    symptoms: Dict[str, int]


class DiseasePrediction(BaseModel):
    """A single disease prediction with its confidence score."""
    condition: str
    probability: float


class DiseaseResult(BaseModel):
    """Full result payload for disease prediction."""
    prediction: str
    top3: List[DiseasePrediction]
    feedback: str
