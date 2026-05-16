# Conventions Map

## Coding Style

### Backend (Python)
- **Framework**: FastAPI (Asynchronous where applicable, though current routes are synchronous).
- **Type Hinting**: Extensive use of Pydantic models for request/response validation.
- **Naming**: `snake_case` for variables and functions.
- **Organization**: Monolithic `main.py` for API logic.

### Frontend (JavaScript/React)
- **Components**: Functional components with `Arrow Functions`.
- **State**: React Hooks (`useState`).
- **Styling**: Utility-first CSS using Tailwind CSS v4.
- **File Extensions**: `.jsx` for React components, `.css` for stylesheets.
- **Naming**: `PascalCase` for components, `camelCase` for variables/hooks.

## Project Patterns
- **Separation of Concerns**: UI in `frontend/`, Business Logic/API in `backend/`, Data Science in `ml_pipeline/`.
- **Artifact Management**: Models are versioned alongside code in the `models/` directory (or linked from `ml_pipeline/models/`).
- **Error Handling**: 
  - Backend: Uses `HTTPException` for API errors.
  - Frontend: Simple try/catch blocks around API calls (inferred).

## Documentation
- **API**: Self-documenting via FastAPI (Swagger/OpenAPI).
- **Project**: Basic `README.md` and structured `.planning/` documents.
