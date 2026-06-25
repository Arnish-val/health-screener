"""
Depression screening service — pure business logic.
Receives pre-loaded model artifacts; performs inference and returns structured results.
"""

import numpy as np

from app.schemas.depression import (
    DepressionInput,
    DepressionResult,
    ProbabilityEntry,
    StudentDepressionInput,
    ProfessionalDepressionInput,
)
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


def predict_depression_professional(
    data: ProfessionalDepressionInput,
    pipeline,
    feature_names: list[str],
    risk_bands: dict,
    encoder,
    categorical_columns: list[str],
) -> DepressionResult:
    """
    Run depression/burnout screening for working professionals.
    """
    try:
        input_map = {
            "Age": float(data.Age),
            "Gender": data.Gender,
            "self_employed": data.self_employed,
            "family_history": data.family_history,
            "work_interfere": data.work_interfere,
            "no_employees": data.no_employees,
            "remote_work": data.remote_work,
            "tech_company": data.tech_company,
            "benefits": data.benefits,
            "care_options": data.care_options,
            "wellness_program": data.wellness_program,
            "seek_help": data.seek_help,
            "anonymity": data.anonymity,
            "leave": data.leave,
            "mental_health_consequence": data.mental_health_consequence,
            "phys_health_consequence": data.phys_health_consequence,
            "coworkers": data.coworkers,
            "supervisor": data.supervisor,
            "mental_health_interview": data.mental_health_interview,
            "phys_health_interview": data.phys_health_interview,
            "mental_vs_physical": data.mental_vs_physical,
            "obs_consequence": data.obs_consequence,
        }

        # Normalize gender using the same logic as training
        def norm_gender(g):
            g = str(g).strip().lower()
            if g in {"m", "male", "man", "cis male", "cis man"}:
                return "Male"
            if g in {"f", "female", "woman", "cis female", "cis woman"}:
                return "Female"
            return "Other"
        input_map["Gender"] = norm_gender(input_map["Gender"])

        # Construct categorical row for encoder transform
        cat_row = [[input_map[col] for col in categorical_columns]]
        encoded_cat = encoder.transform(cat_row)[0]
        encoded_cat_map = dict(zip(categorical_columns, encoded_cat))

        # Build feature vector matching training schema order
        feature_vector = []
        for col in feature_names:
            if col in encoded_cat_map:
                feature_vector.append(encoded_cat_map[col])
            else:
                feature_vector.append(input_map[col])

        arr = np.array([feature_vector], dtype=np.float32)
        prob_depression = float(pipeline.predict_proba(arr)[0][1])

        # Risk band mapping
        risk_label = "Low"
        advice = "No significant burnout or depression risk detected."
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
                    condition="Low Risk",
                    probability=round(1 - prob_depression, 4),
                ),
                ProbabilityEntry(
                    condition="Elevated Risk",
                    probability=round(prob_depression, 4),
                ),
            ],
            feedback=f"Professional screening complete. Identified risk level: {risk_label}.",
        )

    except Exception as e:
        raise PredictionError(f"Professional depression screening failed: {str(e)}")

