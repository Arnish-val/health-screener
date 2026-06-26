"""
Pytest fixtures for the backend test suite.
Creates a test client with mocked ML models.
"""

import pytest
import numpy as np
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import create_app


class FakePipeline:
    """Mock sklearn pipeline that returns deterministic probabilities."""

    def __init__(self, n_classes: int = 3, positive_prob: float = 0.75):
        self.n_classes = n_classes
        self.positive_prob = positive_prob

    def predict_proba(self, X):
        if self.n_classes == 2:
            # Binary classification (depression)
            return np.array([[1 - self.positive_prob, self.positive_prob]])
        # Multi-class (disease) — 42 classes
        probs = np.random.dirichlet(np.ones(self.n_classes))
        probs = np.sort(probs)[::-1]
        return probs.reshape(1, -1)


class FakeLabelEncoder:
    """Mock LabelEncoder with predefined class names."""

    def __init__(self, classes):
        self.classes_ = np.array(classes)


DISEASE_CLASSES = [
    "Common Cold", "Malaria", "Dengue", "Typhoid", "Diabetes",
    "Hypertension", "Migraine", "Arthritis", "Allergy", "Fungal infection",
]

DISEASE_FEATURES = [
    "itching", "skin_rash", "continuous_sneezing", "shivering", "chills",
    "joint_pain", "stomach_pain", "fatigue", "cough", "high_fever",
]

MH_FEATURES = [
    "Gender", "Age", "Academic Pressure", "Work Pressure", "CGPA",
    "Study Satisfaction", "Job Satisfaction", "Sleep Duration",
    "Dietary Habits", "Have you ever had suicidal thoughts ?",
    "Work/Study Hours", "Financial Stress", "Family History of Mental Illness",
]

MH_RISK_BANDS = {
    "Low":      (0.00, 0.35, "#22c55e", "No significant depression risk detected."),
    "Moderate": (0.35, 0.65, "#f59e0b", "Some indicators present. Consider talking to someone."),
    "High":     (0.65, 1.01, "#ef4444", "Strong indicators. Please consult a professional."),
}


@pytest.fixture
def app():
    """Create a FastAPI app instance with mock models loaded into state."""
    test_app = create_app()

    # Inject mock disease artifacts
    test_app.state.disease_pipeline = FakePipeline(n_classes=len(DISEASE_CLASSES))
    test_app.state.disease_label_encoder = FakeLabelEncoder(DISEASE_CLASSES)
    test_app.state.disease_features = DISEASE_FEATURES

    # Inject mock student depression artifacts
    test_app.state.depression_student_pipeline = FakePipeline(n_classes=2, positive_prob=0.75)
    test_app.state.depression_student_features = MH_FEATURES
    test_app.state.depression_student_risk_bands = MH_RISK_BANDS

    # Inject mock professional depression artifacts
    test_app.state.depression_professional_pipeline = FakePipeline(n_classes=2, positive_prob=0.75)
    test_app.state.depression_professional_features = [
        "self_employed", "family_history", "work_interfere", "no_employees",
        "remote_work", "tech_company", "benefits", "care_options",
        "wellness_program", "seek_help", "anonymity", "leave",
        "mental_health_consequence", "phys_health_consequence", "coworkers",
        "supervisor", "mental_health_interview", "phys_health_interview",
        "mental_vs_physical", "obs_consequence", "Gender", "Age"
    ]
    test_app.state.depression_professional_risk_bands = MH_RISK_BANDS

    class FakeEncoder:
        def transform(self, X):
            return np.zeros((len(X), len(X[0])))

    test_app.state.depression_professional_categorical_encoder = FakeEncoder()
    test_app.state.depression_professional_categorical_columns = [
        "self_employed", "family_history", "work_interfere", "no_employees",
        "remote_work", "tech_company", "benefits", "care_options",
        "wellness_program", "seek_help", "anonymity", "leave",
        "mental_health_consequence", "phys_health_consequence", "coworkers",
        "supervisor", "mental_health_interview", "phys_health_interview",
        "mental_vs_physical", "obs_consequence", "Gender"
    ]

    return test_app


@pytest.fixture
def client(app):
    """Test client using mocked app."""
    return TestClient(app)


@pytest.fixture
def client_no_models():
    """Test client with NO models loaded — simulates startup failure."""
    test_app = create_app()
    test_app.state.disease_pipeline = None
    test_app.state.depression_student_pipeline = None
    test_app.state.depression_professional_pipeline = None
    test_app.state.mh_pipeline = None
    return TestClient(test_app)
