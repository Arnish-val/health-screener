"""
Tests for the depression screening API endpoint.
"""


VALID_DEPRESSION_INPUT = {
    "Gender": 1,
    "Age": 21,
    "Academic_Pressure": 4,
    "Work_Pressure": 3,
    "CGPA": 7.5,
    "Study_Satisfaction": 2,
    "Job_Satisfaction": 3,
    "Sleep_Duration": 1,
    "Dietary_Habits": 1,
    "Suicidal_Thoughts": 0,
    "Work_Study_Hours": 8.0,
    "Financial_Stress": 4,
    "Family_History": 0,
}


class TestDepressionEndpoint:
    """Tests for POST /predict/depression"""

    def test_predict_depression_success(self, client):
        """Valid metrics should return a risk profile."""
        response = client.post("/predict/depression", json=VALID_DEPRESSION_INPUT)
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        data = body["data"]
        assert data["risk_level"] in ("Low", "Moderate", "High")
        assert 0 <= data["risk_percentage"] <= 100
        assert len(data["detailed_probs"]) == 2
        assert "disclaimer" in body

    def test_predict_depression_risk_level_format(self, client):
        """Condition should end with 'Risk Profile'."""
        response = client.post("/predict/depression", json=VALID_DEPRESSION_INPUT)
        body = response.json()
        assert body["data"]["condition"].endswith("Risk Profile")

    def test_predict_depression_action_not_empty(self, client):
        """Action field should contain actionable advice."""
        response = client.post("/predict/depression", json=VALID_DEPRESSION_INPUT)
        body = response.json()
        assert len(body["data"]["action"]) > 10  # meaningful advice string

    def test_predict_depression_invalid_types(self, client):
        """Wrong types should return 422."""
        bad_input = {**VALID_DEPRESSION_INPUT, "Age": "not_a_number"}
        response = client.post("/predict/depression", json=bad_input)
        assert response.status_code == 422

    def test_predict_depression_missing_fields(self, client):
        """Missing required fields should return 422."""
        response = client.post("/predict/depression", json={"Gender": 1})
        assert response.status_code == 422

    def test_predict_depression_invalid_age_bounds(self, client):
        """Out of bounds age should return 422."""
        for bad_age in [14, 81, 0, 1000]:
            bad_input = {**VALID_DEPRESSION_INPUT, "Age": bad_age}
            response = client.post("/predict/depression", json=bad_input)
            assert response.status_code == 422

    def test_predict_depression_model_not_loaded(self, client_no_models):
        """When models are not loaded, should return 503."""
        response = client_no_models.post(
            "/predict/depression", json=VALID_DEPRESSION_INPUT
        )
        assert response.status_code == 503
        body = response.json()
        assert body["success"] is False
        assert body["error"]["code"] == "MODEL_NOT_LOADED"

    def test_predict_depression_student_success(self, client):
        """Student endpoint returns risk level."""
        response = client.post("/predict/depression/student", json=VALID_DEPRESSION_INPUT)
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["risk_level"] in ("Low", "Moderate", "High")

    def test_predict_depression_professional_success(self, client):
        """Professional endpoint returns risk level."""
        valid_professional_input = {
            "Age": 30,
            "Gender": "Male",
            "self_employed": "No",
            "family_history": "Yes",
            "work_interfere": "Sometimes",
            "no_employees": "26-100",
            "remote_work": "Yes",
            "tech_company": "Yes",
            "benefits": "Yes",
            "care_options": "Yes",
            "wellness_program": "No",
            "seek_help": "Yes",
            "anonymity": "Yes",
            "leave": "Somewhat easy",
            "mental_health_consequence": "No",
            "phys_health_consequence": "No",
            "coworkers": "Some of them",
            "supervisor": "Yes",
            "mental_health_interview": "No",
            "phys_health_interview": "Maybe",
            "mental_vs_physical": "Yes",
            "obs_consequence": "No"
        }
        response = client.post("/predict/depression/professional", json=valid_professional_input)
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["risk_level"] in ("Low", "Moderate", "High")
