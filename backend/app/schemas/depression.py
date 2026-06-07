"""
Pydantic schemas for the depression / mental health endpoint.
"""

from typing import List
from pydantic import BaseModel, Field


class DepressionInput(BaseModel):
    """Request body: demographic, academic, and lifestyle metrics."""
    Gender: int = Field(..., ge=0, le=1, description="0: Female, 1: Male")
    Age: int = Field(..., ge=15, le=80, description="Age must be between 15 and 80")
    Academic_Pressure: int = Field(..., ge=0, le=5, description="Scale of 0-5")
    Work_Pressure: int = Field(..., ge=0, le=5, description="Scale of 0-5")
    CGPA: float = Field(..., ge=0.0, le=10.0, description="CGPA on a 10.0 scale")
    Study_Satisfaction: int = Field(..., ge=0, le=5, description="Scale of 0-5")
    Job_Satisfaction: int = Field(..., ge=0, le=5, description="Scale of 0-5")
    Sleep_Duration: int = Field(..., ge=0, le=3, description="0-3 category index")
    Dietary_Habits: int = Field(..., ge=0, le=2, description="0-2 category index")
    Suicidal_Thoughts: int = Field(..., ge=0, le=1, description="0: No, 1: Yes")
    Work_Study_Hours: float = Field(..., ge=0.0, le=24.0, description="Daily work/study hours")
    Financial_Stress: int = Field(..., ge=0, le=5, description="Scale of 0-5")
    Family_History: int = Field(..., ge=0, le=1, description="0: No, 1: Yes")


class ProbabilityEntry(BaseModel):
    """Probability for a single class."""
    condition: str
    probability: float


class DepressionResult(BaseModel):
    """Full result payload for depression screening."""
    condition: str
    risk_level: str
    action: str
    risk_percentage: float
    detailed_probs: List[ProbabilityEntry]
    feedback: str
