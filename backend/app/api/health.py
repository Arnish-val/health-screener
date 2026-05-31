"""
Health check endpoint.
"""

from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/")
def health_check():
    """Root health check — confirms the API is running."""
    return {
        "success": True,
        "data": {
            "message": f"Welcome to the {settings.APP_NAME}",
            "version": settings.APP_VERSION,
            "status": "healthy",
        },
    }
