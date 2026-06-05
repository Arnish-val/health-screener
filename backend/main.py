from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import joblib
import pandas as pd
import numpy as np
import os
import warnings
import math

app = FastAPI(title="Health & Wellness Screener API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DISEASE_MODEL_PATH = os.path.join(BASE_DIR, '..', 'ml_pipeline', 'models', 'disease_pipeline.joblib')
MENTAL_HEALTH_MODEL_PATH = os.path.join(BASE_DIR, '..', 'ml_pipeline', 'models', 'mental_health_pipeline.joblib')
ALZ_MODEL_PATH = os.path.join(BASE_DIR, '..', 'ml_pipeline', 'models', 'alzheimers_model.joblib')

try:
    disease_artifacts = joblib.load(DISEASE_MODEL_PATH)
    disease_pipeline = disease_artifacts["pipeline"]
    disease_le = disease_artifacts["label_encoder"]
    disease_features = disease_artifacts["feature_names"]
    print("Disease pipeline loaded.")
    
    mh_artifacts = joblib.load(MENTAL_HEALTH_MODEL_PATH)
    mh_pipeline = mh_artifacts["pipeline"]
    mh_features = mh_artifacts["feature_names"]
    mh_risk_bands = mh_artifacts["risk_bands"]
    print("Mental Health pipeline loaded.")
except Exception as e:
    print(f"Error loading models: {e}")
    disease_pipeline = None
    mh_pipeline = None

# Alzheimer's model
alz_pipeline = None
try:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        alz_pipeline = joblib.load(ALZ_MODEL_PATH)
    print("Alzheimer's pipeline loaded.")
except Exception as e:
    print(f"Error loading Alzheimer's model: {e}")

# -----------------
# Pydantic Schemas
# -----------------
class DiseaseInput(BaseModel):
    symptoms: Dict[str, int]  # Expects dictionary of { symptom_name: 1 or 0 }

class DepressionInput(BaseModel):
    Gender: int
    Age: int
    Academic_Pressure: int
    Work_Pressure: int
    CGPA: float
    Study_Satisfaction: int
    Job_Satisfaction: int
    Sleep_Duration: int
    Dietary_Habits: int
    Suicidal_Thoughts: int
    Work_Study_Hours: float
    Financial_Stress: int
    Family_History: int

class AlzheimersInput(BaseModel):
    cognitive_scores: Dict[str, int] = Field(
        ...,
        description="Cognitive assessment scores by domain"
    )
    fmri_features: Optional[List[float]] = Field(
        None,
        description="1128 fMRI connectivity features (Pearson correlations from 48-ROI atlas)"
    )

# -----------------
# API Endpoints
# -----------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the Unified Health & Wellness Screener API"}

@app.post("/predict/disease")
def predict_disease(data: DiseaseInput):
    if not disease_pipeline:
        raise HTTPException(status_code=500, detail="Disease model not loaded.")
    
    # Safely pull from dict natively avoiding rigid structures for 132+ inputs
    input_dict = data.symptoms
    arr = np.array([[input_dict.get(f, 0) for f in disease_features]], dtype=np.float32)
    
    probs = disease_pipeline.predict_proba(arr)[0]
    top3_idx = np.argsort(probs)[::-1][:3]
    top3_classes = [disease_le.classes_[i] for i in top3_idx]
    top3_probs = [float(probs[i]) for i in top3_idx]
    
    results = [{"condition": cls, "probability": p} for cls, p in zip(top3_classes, top3_probs)]
    
    return {
        "prediction": top3_classes[0], 
        "top3": results,
        "disclaimer": "This is an educational tool, not a clinical diagnostic device."
    }

@app.post("/predict/depression")
def predict_depression(data: DepressionInput):
    if not mh_pipeline:
         raise HTTPException(status_code=500, detail="Depression model not loaded.")
    
    # Map frontend variables explicitly to kaggle feature strings
    input_dict = {
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
        "Family History of Mental Illness": data.Family_History
    }

    arr = np.array([[input_dict.get(f, 0) for f in mh_features]], dtype=np.float32)
    
    prob_depression = mh_pipeline.predict_proba(arr)[0][1]
    
    # Find matching risk label logic from artifacts
    risk_label = "Low"
    color = ""
    advice = ""
    for k, (lo, hi, c, adv) in mh_risk_bands.items():
        if lo <= prob_depression < hi:
            risk_label = k
            color = c
            advice = adv
            break
            
    # Mimic legacy response format for risk
    detailed_probs = [
        {"condition": "No Depression", "probability": float(1 - prob_depression)},
        {"condition": "Depression", "probability": float(prob_depression)},
    ]
    
    return {
        "condition": risk_label + " Risk Profile",
        "risk_level": risk_label,
        "action": advice,
        "risk_percentage": round(prob_depression * 100, 2),
        "detailed_probs": detailed_probs,
        "disclaimer": "This is an educational tool, not a clinical diagnostic device."
    }


# ── Alzheimer's Disease Prediction ───────────────────────────────────────────

def _sigmoid(x):
    """Numerically stable sigmoid."""
    return 1.0 / (1.0 + math.exp(-x))


def _cognitive_risk(total_score, max_score=30):
    """
    Map a MOCA-style cognitive score (0-30) to AD probability.
    Clinical cutoff: score < 26 indicates cognitive impairment.
    Uses a sigmoid curve centered at 26 with a steepness factor.
    """
    midpoint = 26.0
    steepness = 0.8
    return _sigmoid(-steepness * (total_score - midpoint))


@app.post("/predict/alzheimers")
def predict_alzheimers(data: AlzheimersInput):
    """
    Combined Alzheimer's Disease risk prediction.
    Fuses fMRI SVM decision score with cognitive assessment via weighted average.
    """
    # ── Cognitive assessment ──────────────────────────────────────────────
    cognitive_scores = data.cognitive_scores
    total_cognitive = sum(cognitive_scores.values())
    max_cognitive = 30
    total_cognitive = min(max(total_cognitive, 0), max_cognitive)
    p_cognitive = _cognitive_risk(total_cognitive, max_cognitive)

    # Per-domain breakdown
    domain_breakdown = {}
    domain_max = {
        "orientation": 6, "memory": 5, "attention": 6,
        "language": 3, "executive": 5, "visuospatial": 5,
    }
    for domain, score in cognitive_scores.items():
        mx = domain_max.get(domain, 5)
        domain_breakdown[domain] = {
            "score": score,
            "max": mx,
            "pct": round((score / mx) * 100, 1) if mx > 0 else 0,
        }

    # ── fMRI prediction ──────────────────────────────────────────────────
    fmri_result = None
    p_fmri = None

    if data.fmri_features is not None:
        if not alz_pipeline:
            raise HTTPException(status_code=500, detail="Alzheimer's model not loaded.")

        features = data.fmri_features
        if len(features) != 1128:
            raise HTTPException(
                status_code=422,
                detail=f"Expected 1128 fMRI features, got {len(features)}."
            )

        X = np.array([features], dtype=np.float64)
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            prediction = int(alz_pipeline.predict(X)[0])

            # Get SVM decision function → sigmoid for probability
            clf = alz_pipeline.named_steps['clf']
            selector = alz_pipeline.named_steps['selector']
            scaler = alz_pipeline.named_steps['scaler']

            X_scaled = scaler.transform(X)
            X_selected = selector.transform(X_scaled)
            decision = float(clf.decision_function(X_selected)[0])
            p_fmri = _sigmoid(decision)

        fmri_result = {
            "prediction": "AD" if prediction == 1 else "CN",
            "decision_score": round(decision, 4),
            "probability_ad": round(p_fmri, 4),
            "n_features_used": int(selector.get_support().sum()),
        }

    # ── Combined risk ────────────────────────────────────────────────────
    if p_fmri is not None:
        combined_risk = 0.6 * p_fmri + 0.4 * p_cognitive
    else:
        combined_risk = p_cognitive

    # Risk bands
    if combined_risk >= 0.70:
        risk_level = "High"
        risk_color = "#ef4444"
        recommendation = (
            "The combined assessment indicates elevated risk for cognitive impairment "
            "consistent with Alzheimer's disease. Immediate consultation with a "
            "neurologist and comprehensive neuropsychological evaluation is strongly recommended."
        )
    elif combined_risk >= 0.40:
        risk_level = "Moderate"
        risk_color = "#f59e0b"
        recommendation = (
            "The combined assessment shows moderate risk indicators. Consider scheduling "
            "a follow-up cognitive assessment and discussing preventive strategies with "
            "your healthcare provider."
        )
    else:
        risk_level = "Low"
        risk_color = "#10b981"
        recommendation = (
            "The combined assessment indicates low risk. Continue maintaining a healthy "
            "lifestyle with regular cognitive engagement and physical activity."
        )

    return {
        "combined_risk": round(combined_risk, 4),
        "risk_level": risk_level,
        "risk_color": risk_color,
        "recommendation": recommendation,
        "cognitive": {
            "total_score": total_cognitive,
            "max_score": max_cognitive,
            "probability_ad": round(p_cognitive, 4),
            "domains": domain_breakdown,
        },
        "fmri": fmri_result,
        "weights": {
            "fmri": 0.6 if p_fmri is not None else 0.0,
            "cognitive": 0.4 if p_fmri is not None else 1.0,
        },
        "disclaimer": (
            "This is an educational tool, not a clinical diagnostic device. "
            "Alzheimer's disease diagnosis requires comprehensive clinical evaluation "
            "including neuroimaging, biomarkers, and neuropsychological testing."
        ),
    }

