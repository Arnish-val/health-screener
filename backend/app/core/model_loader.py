"""
Lazy model loader using FastAPI lifespan events.
Models are loaded once at startup and cached in app.state.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

import joblib
from fastapi import FastAPI, Request

from app.config import settings

logger = logging.getLogger(__name__)


# ── Lifespan: load models on startup, cleanup on shutdown ────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML pipelines into app.state at startup."""
    logger.info("Loading ML models from %s", settings.MODEL_DIR)

    # Disease pipeline
    disease_path = settings.MODEL_DIR / "disease_pipeline.joblib"
    if disease_path.exists():
        try:
            artifacts = joblib.load(disease_path)
            app.state.disease_pipeline = artifacts["pipeline"]
            app.state.disease_label_encoder = artifacts["label_encoder"]
            app.state.disease_features = artifacts["feature_names"]
            logger.info("Disease pipeline loaded successfully.")
        except Exception as e:
            logger.error("Failed to load disease pipeline: %s", e)
            app.state.disease_pipeline = None
    else:
        logger.warning("Disease pipeline not found at %s", disease_path)
        app.state.disease_pipeline = None

    # Mental health pipeline
    mh_path = settings.MODEL_DIR / "mental_health_pipeline.joblib"
    if mh_path.exists():
        try:
            artifacts = joblib.load(mh_path)
            app.state.mh_pipeline = artifacts["pipeline"]
            app.state.mh_features = artifacts["feature_names"]
            app.state.mh_risk_bands = artifacts["risk_bands"]
            logger.info("Mental health pipeline loaded successfully.")
        except Exception as e:
            logger.error("Failed to load mental health pipeline: %s", e)
            app.state.mh_pipeline = None
    else:
        logger.warning("Mental health pipeline not found at %s", mh_path)
        app.state.mh_pipeline = None

    # Alzheimer's disease pipeline / raw ADNI model
    alz_model_path = settings.MODEL_DIR / "svm_model_final.joblib"
    alz_scaler_path = settings.MODEL_DIR / "scaler_final.joblib"
    legacy_alz_path = settings.MODEL_DIR / "alzheimers_model.joblib"
    app.state.alz_scaler = None

    if alz_model_path.exists():
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                app.state.alz_pipeline = joblib.load(alz_model_path)
                if alz_scaler_path.exists():
                    app.state.alz_scaler = joblib.load(alz_scaler_path)
            logger.info("Alzheimer's ADNI model loaded successfully.")
        except Exception as e:
            logger.error("Failed to load Alzheimer's ADNI model: %s", e)
            app.state.alz_pipeline = None
            app.state.alz_scaler = None
    elif legacy_alz_path.exists():
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                app.state.alz_pipeline = joblib.load(legacy_alz_path)
            logger.info("Legacy Alzheimer's pipeline loaded successfully.")
        except Exception as e:
            logger.error("Failed to load Alzheimer's pipeline: %s", e)
            app.state.alz_pipeline = None
    else:
        logger.warning(
            "Alzheimer's model not found at %s or %s",
            alz_model_path,
            legacy_alz_path,
        )
        app.state.alz_pipeline = None

    yield  # Application runs here

    # Cleanup
    logger.info("Shutting down — releasing model references.")
    app.state.disease_pipeline = None
    app.state.mh_pipeline = None
    app.state.alz_pipeline = None
    app.state.alz_scaler = None


# ── Dependency helpers for route injection ───────────────────────────────────

def get_disease_artifacts(request: Request) -> dict:
    """FastAPI dependency: returns disease model artifacts from app.state."""
    return {
        "pipeline": getattr(request.app.state, "disease_pipeline", None),
        "label_encoder": getattr(request.app.state, "disease_label_encoder", None),
        "features": getattr(request.app.state, "disease_features", None),
    }


def get_mh_artifacts(request: Request) -> dict:
    """FastAPI dependency: returns mental health model artifacts from app.state."""
    return {
        "pipeline": getattr(request.app.state, "mh_pipeline", None),
        "features": getattr(request.app.state, "mh_features", None),
        "risk_bands": getattr(request.app.state, "mh_risk_bands", None),
    }


def get_alz_artifacts(request: Request) -> dict:
    """FastAPI dependency: returns Alzheimer's pipeline from app.state."""
    return {
        "model": getattr(request.app.state, "alz_pipeline", None),
        "scaler": getattr(request.app.state, "alz_scaler", None),
    }
