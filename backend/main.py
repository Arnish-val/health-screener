from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
import joblib
import pandas as pd
import numpy as np
import os

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
