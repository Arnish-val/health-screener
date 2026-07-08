"""
Health & Wellness Screener — FastAPI Application Factory.

This is the main entry point for the refactored backend.
Run with: uvicorn app.main:app --reload
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.router import api_router
from app.core.model_loader import lifespan
from app.core.exceptions import register_exception_handlers
from app.db.database import engine, Base
from app.models import user, history
from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure new columns exist in the users table (lightweight migration for existing databases)
with engine.connect() as conn:
    for column_name in ["name", "picture_url"]:
        try:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} VARCHAR"))
            conn.commit()
        except Exception:
            pass

# ── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "A portfolio-grade healthcare assessment API powered by machine learning. "
            "Provides disease prediction from symptom analysis and depression risk screening."
        ),
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ───────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routes ───────────────────────────────────────────────────────────────
    # Mount under /api/v1 AND at root for backward compatibility
    app.include_router(api_router, prefix=settings.API_PREFIX)
    app.include_router(api_router)  # root mount for legacy frontend

    logger.info(
        "%s v%s starting | CORS origins: %s",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.CORS_ORIGINS,
    )

    return app


# The app instance used by uvicorn
app = create_app()
