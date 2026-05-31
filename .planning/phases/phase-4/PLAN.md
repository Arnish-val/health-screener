# Phase 4: AI & UI Polish — Execution Plan

## Goal
Implement intelligent feedback, finalize all UI animations using framer-motion, ensure strict accessibility compliance, and finalize responsive design.

---

## Task 1: AI-driven Feedback System
**Priority:** High | **Estimated Effort:** Medium

### 1.1 Backend Service Update
- Modify `backend/app/services/disease_service.py` and `depression_service.py` to generate detailed, intelligent rule-based feedback based on the exact combination of symptoms/metrics provided.
- Create a `feedback_generator.py` module in `backend/app/services/` to encapsulate this logic.
- Update schemas to return `feedback` strings.

### 1.2 Frontend Integration
- Display the generated intelligent feedback in the `DiseaseResults` and `RiskResults` components.
- Use a dedicated `<Alert variant="info">` or a custom AI feedback card to highlight this insight.

---

## Task 2: Fluid UI Animations
**Priority:** Medium | **Estimated Effort:** Low

### 2.1 Framer Motion Integration
- Apply `framer-motion` to the `DiseasePredictor` step transitions (Symptoms -> Loading -> Results).
- Add reveal animations to the `LandingScreen` feature cards on scroll.
- Ensure all animations respect `prefers-reduced-motion` for accessibility.

---

## Task 3: Accessibility (A11y) & Disclaimer
**Priority:** High | **Estimated Effort:** Low

### 3.1 Disclaimer Component
- Extract the disclaimer text into a dedicated, highly visible `Disclaimer.jsx` component that sticks to the footer or header on all medical screens.

### 3.2 A11y Audit
- Ensure all `<button>` and `<input>` elements have proper `aria-labels`.
- Check keyboard navigation (tab order) throughout the screeners.

---

## Task 4: Responsive Design Optimization
**Priority:** Medium | **Estimated Effort:** Low

### 4.1 Mobile Polish
- Ensure the `SymptomGrid` collapses gracefully to 1 column on mobile.
- Adjust padding and typography scales for smaller screens.

---

## Execution Order
- Wave 1: Task 1 (Backend & Frontend Feedback Integration)
- Wave 2: Task 2 & Task 3 (Animations & Accessibility)
- Wave 3: Task 4 (Mobile Optimization)
