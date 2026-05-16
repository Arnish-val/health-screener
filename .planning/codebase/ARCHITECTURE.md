# Architecture Map

## System Overview
The Health & Wellness Screener is a decoupled client-server application designed for health assessment using machine learning.

## Key Components

### 1. Frontend (React/Vite)
- **Role**: User interface and data collection.
- **Pattern**: Component-based UI with functional components and hooks.
- **State**: Manages form state for symptoms and demographic data.

### 2. Backend (FastAPI)
- **Role**: API gateway and inference engine.
- **Pattern**: RESTful endpoints.
- **Inference**: Loads pre-trained ML pipelines into memory on startup for low-latency predictions.

### 3. ML Pipeline (Python)
- **Role**: Data preprocessing and model training.
- **Pattern**: Scripts for offline training and artifact generation.
- **Artifacts**: Scikit-learn pipelines that encapsulate both preprocessing (scaling, encoding) and the estimator.

## Data Flow
1. **User Input**: User selects symptoms/inputs data on the React frontend.
2. **API Request**: Frontend sends a JSON payload to the FastAPI backend.
3. **Preprocessing**: Backend maps input keys to the feature names expected by the ML pipeline.
4. **Inference**: The pipeline processes the feature vector and returns probabilities.
5. **Post-processing**: Backend translates probabilities into risk labels and advice.
6. **Display**: Frontend renders results with animations and clear visual indicators.
