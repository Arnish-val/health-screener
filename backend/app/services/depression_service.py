"""
Depression screening service — pure business logic.
Receives pre-loaded model artifacts; performs inference and returns structured results.
"""

import numpy as np

from app.schemas.depression import DepressionInput, DepressionResult, ProbabilityEntry
from app.core.exceptions import PredictionError


def predict_depression(
    data: DepressionInput,
    pipeline,
    feature_names: list[str],
    risk_bands: dict,
) -> DepressionResult:
    """
    Run depression risk screening.

    Args:
        data: Validated input metrics from the request.
        pipeline: Trained sklearn pipeline.
        feature_names: Ordered list of expected feature column names.
        risk_bands: Dict mapping risk level → (low, high, color, advice).

    Returns:
        DepressionResult with risk level, percentage, and actionable advice.
    """
    try:
        # Map frontend field names to the Kaggle feature names
        input_map = {
            "Gender": data.Gender,
            "Age": data.Age,
            "Academic Pressure": data.Academic_Pressure,
            "Work Pressure": data.Work_Pressure,
            "CGPA": data.CGPA,
            "Study Satisfaction": data.Study_Satisfaction,
            "Job Satisfaction": data.Job_Satisfaction,
            "Sleep Duration": data.Sleep_Duration,
            "Dietary Habits": data.Dietary_Habits,
            "Have you ever had suicidal thoughts ?": data.Suicidal_Thoughts,
            "Work/Study Hours": data.Work_Study_Hours,
            "Financial Stress": data.Financial_Stress,
            "Family History of Mental Illness": data.Family_History,
        }

        arr = np.array(
            [[input_map.get(f, 0) for f in feature_names]],
            dtype=np.float32,
        )

        prob_depression = float(pipeline.predict_proba(arr)[0][1])

        # Determine risk band
        risk_label = "Low"
        advice = "No significant depression risk detected."
        for label, (lo, hi, _color, band_advice) in risk_bands.items():
            if lo <= prob_depression < hi:
                risk_label = label
                advice = band_advice
                break

        return DepressionResult(
            condition=f"{risk_label} Risk Profile",
            risk_level=risk_label,
            action=advice,
            risk_percentage=round(prob_depression * 100, 2),
            detailed_probs=[
                ProbabilityEntry(
                    condition="No Depression",
                    probability=round(1 - prob_depression, 4),
                ),
                ProbabilityEntry(
                    condition="Depression",
                    probability=round(prob_depression, 4),
                ),
            ],
            feedback=__import__('app.services.feedback_generator', fromlist=['']).generate_depression_feedback(risk_label, input_map),
        )

    except Exception as e:
        raise PredictionError(f"Depression screening failed: {str(e)}")
