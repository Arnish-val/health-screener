"""
Unit tests for the service layer — pure business logic.
"""

import numpy as np
import pytest

from app.services.disease_service import predict_disease
from app.services.depression_service import predict_depression
from app.schemas.depression import DepressionInput
from tests.conftest import (
    FakePipeline, FakeLabelEncoder,
    DISEASE_CLASSES, DISEASE_FEATURES,
    MH_FEATURES, MH_RISK_BANDS,
)


class TestDiseaseService:
    """Tests for disease_service.predict_disease()"""

    def test_returns_top3(self):
        """Should always return exactly 3 predictions."""
        result = predict_disease(
            symptoms={"itching": 1, "cough": 1},
            pipeline=FakePipeline(n_classes=len(DISEASE_CLASSES)),
            label_encoder=FakeLabelEncoder(DISEASE_CLASSES),
            feature_names=DISEASE_FEATURES,
        )
        assert len(result.top3) == 3

    def test_prediction_matches_top1(self):
        """The `prediction` field should match the top-1 condition."""
        result = predict_disease(
            symptoms={},
            pipeline=FakePipeline(n_classes=len(DISEASE_CLASSES)),
            label_encoder=FakeLabelEncoder(DISEASE_CLASSES),
            feature_names=DISEASE_FEATURES,
        )
        assert result.prediction == result.top3[0].condition

    def test_probabilities_are_valid(self):
        """All probabilities should be between 0 and 1."""
        result = predict_disease(
            symptoms={"fatigue": 1},
            pipeline=FakePipeline(n_classes=len(DISEASE_CLASSES)),
            label_encoder=FakeLabelEncoder(DISEASE_CLASSES),
            feature_names=DISEASE_FEATURES,
        )
        for pred in result.top3:
            assert 0 <= pred.probability <= 1


class TestDepressionService:
    """Tests for depression_service.predict_depression()"""

    def _make_input(self, **overrides):
        defaults = {
            "Gender": 1, "Age": 21, "Academic_Pressure": 3,
            "Work_Pressure": 2, "CGPA": 7.5, "Study_Satisfaction": 3,
            "Job_Satisfaction": 3, "Sleep_Duration": 2, "Dietary_Habits": 1,
            "Suicidal_Thoughts": 0, "Work_Study_Hours": 6.0,
            "Financial_Stress": 3, "Family_History": 0,
        }
        defaults.update(overrides)
        return DepressionInput(**defaults)

    def test_high_risk_band(self):
        """Probability 0.75 should map to 'High' risk."""
        result = predict_depression(
            data=self._make_input(),
            pipeline=FakePipeline(n_classes=2, positive_prob=0.75),
            feature_names=MH_FEATURES,
            risk_bands=MH_RISK_BANDS,
        )
        assert result.risk_level == "High"
        assert result.risk_percentage == 75.0

    def test_low_risk_band(self):
        """Probability 0.10 should map to 'Low' risk."""
        result = predict_depression(
            data=self._make_input(),
            pipeline=FakePipeline(n_classes=2, positive_prob=0.10),
            feature_names=MH_FEATURES,
            risk_bands=MH_RISK_BANDS,
        )
        assert result.risk_level == "Low"

    def test_moderate_risk_band(self):
        """Probability 0.50 should map to 'Moderate' risk."""
        result = predict_depression(
            data=self._make_input(),
            pipeline=FakePipeline(n_classes=2, positive_prob=0.50),
            feature_names=MH_FEATURES,
            risk_bands=MH_RISK_BANDS,
        )
        assert result.risk_level == "Moderate"

    def test_detailed_probs_sum_to_one(self):
        """Depression + No Depression probabilities should sum to ~1."""
        result = predict_depression(
            data=self._make_input(),
            pipeline=FakePipeline(n_classes=2, positive_prob=0.42),
            feature_names=MH_FEATURES,
            risk_bands=MH_RISK_BANDS,
        )
        total = sum(p.probability for p in result.detailed_probs)
        assert abs(total - 1.0) < 0.01
