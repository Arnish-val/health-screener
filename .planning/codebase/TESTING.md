# Testing Map

## Current State
The codebase currently lacks automated testing infrastructure.

## Gaps
- **Unit Tests**: No unit tests for backend logic or frontend components.
- **Integration Tests**: No end-to-end tests for the API or the full application flow.
- **ML Evaluation**: Model performance is likely evaluated within `train_models.py`, but there are no persistent test suites or benchmarks.

## Proposed Strategy
1. **Backend**: Implement `pytest` with `httpx` for API testing.
2. **Frontend**: Introduce `Vitest` and `React Testing Library` for component verification.
3. **E2E**: Use `Playwright` for full-stack integration testing.
4. **CI/CD**: Add GitHub Actions to run tests on every push.
