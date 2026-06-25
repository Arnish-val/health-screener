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


class StudentDepressionInput(DepressionInput):
    """Request body: demographic, academic, and lifestyle metrics for student screener."""
    pass


class ProfessionalDepressionInput(BaseModel):
    """Request body: workplace environment and stigma metrics for professional screener."""
    Age: int = Field(..., ge=15, le=90, description="Age must be between 15 and 90")
    Gender: str = Field(..., description="Gender: Female, Male, or Other")
    self_employed: str = Field(..., description="Self-employed status: Yes, No")
    family_history: str = Field(..., description="Family history of mental illness: Yes, No")
    work_interfere: str = Field(..., description="Mental health interference: Often, Sometimes, Rarely, Never, Don't know")
    no_employees: str = Field(..., description="Company size: 1-5, 6-25, 26-100, 100-500, 500-1000, More than 1000")
    remote_work: str = Field(..., description="Remote work: Yes, No")
    tech_company: str = Field(..., description="Tech company: Yes, No")
    benefits: str = Field(..., description="Mental health benefits: Yes, No, Don't know")
    care_options: str = Field(..., description="Mental health care options: Yes, No, Not sure")
    wellness_program: str = Field(..., description="Wellness program discussion: Yes, No, Don't know")
    seek_help: str = Field(..., description="Help resources: Yes, No, Don't know")
    anonymity: str = Field(..., description="Anonymity protection: Yes, No, Don't know")
    leave: str = Field(..., description="Ease of taking medical leave: Very easy, Somewhat easy, Don't know, Somewhat difficult, Very difficult")
    mental_health_consequence: str = Field(..., description="Consequences of mental health discussion: Yes, No, Maybe")
    phys_health_consequence: str = Field(..., description="Consequences of physical health discussion: Yes, No, Maybe")
    coworkers: str = Field(..., description="Discussion with coworkers: Yes, No, Some of them")
    supervisor: str = Field(..., description="Discussion with direct supervisor: Yes, No, Some of them")
    mental_health_interview: str = Field(..., description="Mental health in interview: Yes, No, Maybe")
    phys_health_interview: str = Field(..., description="Physical health in interview: Yes, No, Maybe")
    mental_vs_physical: str = Field(..., description="Mental vs physical health importance: Yes, No, Don't know")
    obs_consequence: str = Field(..., description="Observed negative consequences: Yes, No")



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
