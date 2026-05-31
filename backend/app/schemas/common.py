"""
Shared / generic response models used across all endpoints.
"""

from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

MEDICAL_DISCLAIMER = (
    "This is an educational tool and portfolio demonstration. "
    "It is NOT a clinical diagnostic device and should never replace "
    "professional medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare provider for health concerns."
)


class ErrorDetail(BaseModel):
    code: str
    message: str


class APIResponse(BaseModel, Generic[T]):
    """Standardized API response wrapper."""
    success: bool = True
    data: Optional[T] = None
    disclaimer: str = MEDICAL_DISCLAIMER
    error: Optional[ErrorDetail] = None
