"""
Custom exception hierarchy and FastAPI exception handlers.
Provides consistent JSON error responses across the API.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ── Exception classes ────────────────────────────────────────────────────────

class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, code: str = "APP_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


class ModelNotLoadedError(AppException):
    """Raised when an ML model is not available for inference."""

    def __init__(self, model_name: str = "unknown"):
        super().__init__(
            message=f"Model '{model_name}' is not loaded. Please try again later.",
            code="MODEL_NOT_LOADED",
            status_code=503,
        )


class PredictionError(AppException):
    """Raised when model inference fails."""

    def __init__(self, detail: str = "Prediction failed"):
        super().__init__(
            message=detail,
            code="PREDICTION_ERROR",
            status_code=500,
        )


class ValidationError(AppException):
    """Raised for custom validation failures beyond Pydantic's built-in checks."""

    def __init__(self, detail: str = "Validation failed"):
        super().__init__(
            message=detail,
            code="VALIDATION_ERROR",
            status_code=422,
        )


# ── FastAPI exception handlers ───────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """Attach custom exception handlers to the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred.",
                },
            },
        )
