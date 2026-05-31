"""
Central router aggregator.
Collects all sub-routers and mounts them under the API prefix.
"""

from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.disease import router as disease_router
from app.api.depression import router as depression_router
from app.api.auth import router as auth_router
from app.api.history import router as history_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(disease_router)
api_router.include_router(depression_router)
api_router.include_router(auth_router)
api_router.include_router(history_router)
