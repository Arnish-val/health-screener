# Integrations Map

## Internal Integrations

### Frontend ↔ Backend
- **Type**: REST API
- **Client**: Axios (frontend) ↔ FastAPI (backend)
- **Endpoints**:
  - `POST /predict/disease`: Accepts symptom dictionary, returns top 3 disease predictions.
  - `POST /predict/depression`: Accepts demographic and stress data, returns depression risk profile.

### Backend ↔ ML Models
- **Method**: Joblib loading of serialized pipelines.
- **Location**: `ml_pipeline/models/`
- **Artifacts**:
  - `disease_pipeline.joblib`: Complete pipeline for disease prediction.
  - `mental_health_pipeline.joblib`: Complete pipeline for depression risk.

## External Integrations
- **CORS**: Currently set to `allow_origins=["*"]`, enabling access from any origin.
- **Deployment**: `render.yaml` defines a `web` service for the backend and a `static` service for the frontend.
