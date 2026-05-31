"""
Application configuration via pydantic-settings.
All values can be overridden with environment variables or a `.env` file.
"""

from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "Health & Wellness Screener API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
    ]

    # ── Model paths ──────────────────────────────────────────────
    MODEL_DIR: Path = Path(__file__).resolve().parent.parent.parent / "ml_pipeline" / "models"

    # ── Server ───────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
