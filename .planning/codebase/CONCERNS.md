# Concerns Map

## High Priority
- **Lack of Automated Testing**: No tests exist to prevent regressions in API or UI.
- **CORS Configuration**: `allow_origins=["*"]` in `main.py` is insecure for production and should be restricted to specific domains.
- **Hardcoded Model Paths**: The backend relies on relative paths (`..`) to find models, which may break depending on the execution environment.

## Medium Priority
- **Component Complexity**: React components like `DepressionScreener.jsx` are growing large and should be refactored into smaller, reusable sub-components.
- **Dependency Management**: `backend/requirements.txt` contains many pinned versions; a strategy for regular updates is needed.
- **Model Size**: Joblib artifacts can be large; if the number of models grows, an external storage or model registry (e.g., MLflow) may be needed.

## Low Priority
- **Mock Data dependence**: Significant reliance on mock data generation; real-world data validation is crucial for clinical relevance.
- **Disclaimer Visibility**: While disclaimers exist in the API response, ensuring they are prominently displayed and legally robust in the UI is essential.
