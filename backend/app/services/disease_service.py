"""
Disease prediction service — pure business logic.
Receives pre-loaded model artifacts; performs inference and returns structured results.
"""

import numpy as np

from app.schemas.disease import DiseaseResult, DiseasePrediction
from app.core.exceptions import PredictionError


def predict_disease(
    symptoms: dict[str, int],
    pipeline,
    label_encoder,
    feature_names: list[str],
) -> DiseaseResult:
    """
    Run disease prediction against the symptom vector.

    Args:
        symptoms: Dictionary of { symptom_name: 0 or 1 }.
        pipeline: Trained sklearn pipeline (calibrated).
        label_encoder: LabelEncoder for disease class names.
        feature_names: Ordered list of expected feature column names.

    Returns:
        DiseaseResult with top-3 predicted conditions and probabilities.
    """
    try:
        # Build feature vector in the correct column order
        arr = np.array(
            [[symptoms.get(f, 0) for f in feature_names]],
            dtype=np.float32,
        )

        probs = pipeline.predict_proba(arr)[0]
        top3_idx = np.argsort(probs)[::-1][:3]

        top3 = [
            DiseasePrediction(
                condition=label_encoder.classes_[i],
                probability=round(float(probs[i]), 4),
            )
            for i in top3_idx
        ]

        from app.services.feedback_generator import generate_disease_feedback
        feedback_text = generate_disease_feedback(symptoms, top3[0].condition)

        return DiseaseResult(
            prediction=top3[0].condition,
            top3=top3,
            feedback=feedback_text,
        )

    except Exception as e:
        raise PredictionError(f"Disease prediction failed: {str(e)}")
