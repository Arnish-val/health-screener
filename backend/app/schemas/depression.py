"""
Pydantic schemas for the depression / mental health endpoint.
"""

from typing import List
from pydantic import BaseModel


class DepressionInput(BaseModel):
    """Request body: demographic, academic, and lifestyle metrics."""
    Gender: int
    Age: int
    Academic_Pressure: int
    Work_Pressure: int
    CGPA: float
    Study_Satisfaction: int
    Job_Satisfaction: int
    Sleep_Duration: int
    Dietary_Habits: int
    Suicidal_Thoughts: int
    Work_Study_Hours: float
    Financial_Stress: int
    Family_History: int


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
