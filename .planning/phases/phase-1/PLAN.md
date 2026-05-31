# Phase 1: Foundation & Architecture Refactor — Execution Plan

## Goal
Transform the current monolithic codebase into a clean, testable, professional architecture that demonstrates senior-level engineering practices to recruiters.

---

## Task 1: Backend Architecture Refactor
**Priority:** Critical | **Estimated Effort:** High

### Current State
- All logic lives in a single `backend/main.py` (142 lines).
- Models loaded at module scope with a bare try/except.
- No separation between routing, business logic, and data access.
- `CORS allow_origins=["*"]` — insecure.

### Target Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app factory, middleware, lifespan
│   ├── config.py             # Settings via pydantic-settings (env-based)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py         # Central router aggregator
│   │   ├── disease.py        # POST /predict/disease
│   │   ├── depression.py     # POST /predict/depression
│   │   └── health.py         # GET / (health check)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── disease.py        # DiseaseInput, DiseaseResult
│   │   ├── depression.py     # DepressionInput, DepressionResult
│   │   └── common.py         # APIResponse wrapper, ErrorResponse
│   ├── services/
│   │   ├── __init__.py
│   │   ├── disease_service.py   # Disease prediction logic
│   │   └── depression_service.py # Depression screening logic
│   └── core/
│       ├── __init__.py
│       ├── model_loader.py   # Lazy model loading with caching
│       └── exceptions.py     # Custom exception hierarchy + handlers
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Pytest fixtures (test client, mock models)
│   ├── test_disease_api.py   # Disease endpoint tests
│   ├── test_depression_api.py # Depression endpoint tests
│   └── test_services.py      # Unit tests for service layer
├── requirements.txt          # Updated with test deps
└── pytest.ini                # Pytest configuration
```

### Implementation Steps

#### 1.1 Create `app/config.py`
- Use `pydantic-settings` for env-based configuration.
- Settings: `CORS_ORIGINS` (list), `MODEL_DIR` (path), `DEBUG` (bool), `API_PREFIX` (str).
- Defaults suitable for local dev; overridable via `.env` or environment.

#### 1.2 Create `app/core/exceptions.py`
- Define `ModelNotLoadedError`, `PredictionError`.
- Register FastAPI exception handlers that return standardized JSON:
  ```json
  { "success": false, "error": { "code": "MODEL_NOT_LOADED", "message": "..." } }
  ```

#### 1.3 Create `app/core/model_loader.py`
- Load models lazily on first request using FastAPI `lifespan` events.
- Cache loaded pipelines in app state.
- Expose `get_disease_pipeline()` and `get_mh_pipeline()` dependency functions.

#### 1.4 Create `app/schemas/`
- `common.py`: Generic `APIResponse[T]` wrapper with `success`, `data`, `disclaimer` fields.
- `disease.py`: `DiseaseInput`, `DiseasePrediction`, `DiseaseResult`.
- `depression.py`: `DepressionInput`, `DepressionResult` with risk level typing.

#### 1.5 Create `app/services/`
- `disease_service.py`: Pure function `predict_disease(symptoms: dict, pipeline, label_encoder, features) -> DiseaseResult`.
- `depression_service.py`: Pure function `predict_depression(data: DepressionInput, pipeline, features, risk_bands) -> DepressionResult`.
- NO direct model loading — receive dependencies via function args.

#### 1.6 Create `app/api/` routes
- `disease.py`: `@router.post("/predict/disease")` — validates, calls service, wraps response.
- `depression.py`: `@router.post("/predict/depression")` — validates, calls service, wraps response.
- `health.py`: `@router.get("/")` — returns app status + loaded model info.
- `router.py`: Aggregates all sub-routers under `/api/v1`.

#### 1.7 Create `app/main.py` (app factory)
- FastAPI instance with metadata (title, description, version).
- CORS configured from `config.py` (default: `["http://localhost:5173"]`).
- Include the central router.
- Lifespan context manager for model loading/cleanup.

#### 1.8 Update `requirements.txt`
- Add: `pydantic-settings`, `pytest`, `httpx`, `pytest-asyncio`.
- Pin new deps to compatible versions.

---

## Task 2: Backend Test Suite
**Priority:** Critical | **Estimated Effort:** Medium

### Tests to Write

#### `tests/conftest.py`
- `app_client` fixture: Creates `httpx.AsyncClient` with test app.
- `mock_disease_pipeline` fixture: Returns a mock pipeline that always returns known probabilities.
- `mock_mh_pipeline` fixture: Returns a mock pipeline for depression predictions.

#### `tests/test_disease_api.py`
- `test_predict_disease_success`: Valid symptoms → 200 + top-3 results.
- `test_predict_disease_empty_symptoms`: No symptoms → still returns valid (all zeros).
- `test_predict_disease_invalid_body`: Malformed JSON → 422.

#### `tests/test_depression_api.py`
- `test_predict_depression_success`: Valid metrics → 200 + risk profile.
- `test_predict_depression_boundary_values`: Edge values → correct risk bands.
- `test_predict_depression_invalid_types`: Wrong types → 422.

#### `tests/test_services.py`
- `test_disease_service_top3_ordering`: Verify probabilities are sorted descending.
- `test_depression_service_risk_bands`: Verify Low/Moderate/High boundaries.

---

## Task 3: Frontend Architecture Refactor
**Priority:** High | **Estimated Effort:** High

### Current State
- 5 components in a flat `components/` directory.
- `API_URL` hardcoded in each component.
- No service layer — Axios calls embedded in components.
- Large monolithic components (DiseasePredictor: 220 lines, DepressionScreener: 236 lines).

### Target Structure
```
frontend/src/
├── api/
│   ├── client.js             # Axios instance with baseURL, interceptors
│   ├── diseaseApi.js          # predictDisease(symptoms) -> result
│   └── depressionApi.js       # predictDepression(metrics) -> result
├── components/
│   ├── ui/                    # Reusable design system components
│   │   ├── Button.jsx         # Primary, Secondary, Danger variants
│   │   ├── Card.jsx           # Glass card with header/body pattern
│   │   ├── Input.jsx          # Text, Number, Range inputs
│   │   ├── Select.jsx         # Styled select dropdown
│   │   ├── Badge.jsx          # Status badges / tags
│   │   ├── Skeleton.jsx       # Loading skeleton placeholder
│   │   ├── Alert.jsx          # Error, Warning, Info, Success
│   │   └── ProgressBar.jsx    # Animated progress indicator
│   ├── layout/
│   │   ├── Navbar.jsx         # Refactored from App.jsx inline nav
│   │   ├── Footer.jsx         # New: site footer with disclaimer
│   │   └── PageWrapper.jsx    # Consistent page padding/max-width
│   ├── disease/
│   │   ├── DiseasePredictor.jsx  # Orchestrator (slimmed down)
│   │   ├── SymptomGrid.jsx       # Extracted: symptom selection grid
│   │   ├── SymptomTags.jsx       # Extracted: selected symptom chips
│   │   └── DiseaseResults.jsx    # Extracted: results display
│   ├── depression/
│   │   ├── DepressionScreener.jsx # Orchestrator (slimmed down)
│   │   ├── DemographicForm.jsx    # Extracted: demographic inputs
│   │   ├── StressMetrics.jsx      # Extracted: sliders section
│   │   ├── LifestyleForm.jsx      # Extracted: lifestyle selects
│   │   └── RiskResults.jsx        # Extracted: risk display + bar
│   ├── shared/
│   │   └── Disclaimer.jsx         # Enhanced: more prominent
│   └── home/
│       └── LandingScreen.jsx      # Stays largely the same
├── hooks/
│   ├── useApi.js              # Generic async state hook (loading/error/data)
│   └── useDarkMode.js         # Extracted from App.jsx
├── App.jsx                    # Simplified: layout + routing only
├── index.css                  # Updated with design system tokens
└── main.jsx                   # Entry point (unchanged)
```

### Implementation Steps

#### 3.1 Create `api/client.js`
- Axios instance with `baseURL` from `import.meta.env.VITE_API_URL`.
- Request/response interceptors for logging and error normalization.
- Timeout configuration (10s default).

#### 3.2 Create `api/diseaseApi.js` and `api/depressionApi.js`
- Thin wrappers: `export const predictDisease = (symptoms) => client.post('/predict/disease', { symptoms })`.
- Return normalized data (unwrap `.data`).

#### 3.3 Create `hooks/useApi.js`
```jsx
// Returns { data, loading, error, execute }
// Manages loading/error/data state for any async API call
```

#### 3.4 Create `hooks/useDarkMode.js`
- Extract dark mode logic from App.jsx into a reusable hook.

#### 3.5 Build `components/ui/` library
- **Button**: Variants (primary, secondary, danger, ghost). Sizes (sm, md, lg). Loading state with spinner.
- **Card**: Glass card wrapper with optional header. Dark mode aware.
- **Skeleton**: Pulse animation placeholder for async loading states.
- **Alert**: Variant-based (error, warning, info, success) with icon.
- **ProgressBar**: Animated width transition, color variants.
- **Badge**: Pill-shaped status indicators.

#### 3.6 Decompose `DiseasePredictor.jsx`
- Extract `SymptomGrid.jsx`: Takes symptoms, toggleSymptom, search props.
- Extract `SymptomTags.jsx`: Takes selectedSymptoms, onRemove props.
- Extract `DiseaseResults.jsx`: Takes result data, renders top-3 cards.
- Orchestrator: Slim component that wires hooks + sub-components.

#### 3.7 Decompose `DepressionScreener.jsx`
- Extract `DemographicForm.jsx`: Gender, Age fields.
- Extract `StressMetrics.jsx`: All slider-based metrics.
- Extract `LifestyleForm.jsx`: Sleep, Diet selects.
- Extract `RiskResults.jsx`: Risk level display + progress bar.

#### 3.8 Refactor `App.jsx`
- Extract inline navbar into `layout/Navbar.jsx`.
- Use `useDarkMode` hook.
- Add `PageWrapper` for consistent layout.

#### 3.9 Enhance `Disclaimer.jsx`
- Make it more prominent: larger, fixed-position banner or sticky footer element.
- Use the `Alert` component with `warning` variant.
- Ensure it appears on EVERY result screen AND in the footer.

---

## Task 4: Frontend Test Setup
**Priority:** Medium | **Estimated Effort:** Medium

### Setup
- Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- Configure `vitest.config.js` with jsdom environment.
- Add `test` script to `package.json`.

### Tests to Write

#### `__tests__/components/ui/Button.test.jsx`
- Renders with correct variant classes.
- Shows loading spinner when `loading=true`.
- Fires onClick handler.

#### `__tests__/components/ui/Alert.test.jsx`
- Renders correct icon per variant.
- Displays message text.

#### `__tests__/hooks/useApi.test.js`
- Sets loading=true on execute.
- Sets data on success.
- Sets error on failure.

---

## Task 5: Design System CSS Tokens
**Priority:** Medium | **Estimated Effort:** Low

### Update `index.css`
Apply the `ui-ux-pro-max` MASTER.md design system:
- **Colors**: Update `@theme` block with OLED dark palette (`#020617` bg, `#0F172A` primary, `#22C55E` accent).
- **Typography**: Already using Figtree + Noto Sans — keep.
- **Spacing**: Add CSS custom properties for spacing scale.
- **Shadows**: Add `--shadow-sm` through `--shadow-xl`.
- **Component classes**: Update `.glass-panel`, `.glass-card`, `.glass-input` to align with new palette.

---

## Execution Order (Dependency-Aware)

```
Wave 1 (Independent — can be parallel):
  ├── Task 1.1-1.4: Backend config, exceptions, model loader, schemas
  └── Task 5: Design system CSS tokens

Wave 2 (Depends on Wave 1):
  ├── Task 1.5-1.7: Backend services, routes, app factory
  └── Task 3.1-3.5: Frontend API layer, hooks, UI components

Wave 3 (Depends on Wave 2):
  ├── Task 1.8: Update requirements
  ├── Task 2: Backend tests
  ├── Task 3.6-3.9: Component decomposition
  └── Task 4: Frontend tests
```

---

## Verification Plan

### Automated
1. `cd backend && pytest -v` — All backend tests pass.
2. `cd frontend && npm run test` — All frontend tests pass.
3. `cd frontend && npm run build` — Production build succeeds with no errors.
4. Start backend + frontend, manually test both prediction flows in browser.

### Quality Checks
- [ ] No `axios` imports inside components (all via `api/` layer).
- [ ] No hardcoded API URLs in components.
- [ ] Every UI component in `components/ui/` accepts variant/size props.
- [ ] `Disclaimer` is visible on result screens AND in footer.
- [ ] CORS restricted to `localhost:5173` in dev config.

---

## Success Criteria
- [ ] Backend split into routes / services / schemas / core (4 layers).
- [ ] Frontend split into api / hooks / ui / feature-components (4 layers).
- [ ] ≥10 backend tests passing.
- [ ] ≥5 frontend tests passing.
- [ ] Both prediction endpoints functional end-to-end.
- [ ] Design system tokens applied to index.css.
- [ ] Disclaimer prominently displayed.
