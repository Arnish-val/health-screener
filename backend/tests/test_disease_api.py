"""
Tests for the disease prediction API endpoint.
"""


class TestDiseaseEndpoint:
    """Tests for POST /predict/disease"""

    def test_predict_disease_success(self, client):
        """Valid symptoms should return top-3 predictions."""
        response = client.post(
            "/predict/disease",
            json={"symptoms": {"itching": 1, "skin_rash": 1, "fatigue": 1}},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["prediction"]  # non-empty string
        assert len(body["data"]["top3"]) == 3
        assert "disclaimer" in body

    def test_predict_disease_empty_symptoms(self, client):
        """Empty symptoms should still return a valid prediction (all zeros)."""
        response = client.post("/predict/disease", json={"symptoms": {}})
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert len(body["data"]["top3"]) == 3

    def test_predict_disease_probabilities_sum(self, client):
        """Top-3 probabilities should be non-negative numbers."""
        response = client.post(
            "/predict/disease",
            json={"symptoms": {"cough": 1, "high_fever": 1}},
        )
        body = response.json()
        for pred in body["data"]["top3"]:
            assert pred["probability"] >= 0
            assert pred["probability"] <= 1

    def test_predict_disease_invalid_body(self, client):
        """Malformed JSON should return 422."""
        response = client.post("/predict/disease", json={"bad_key": "data"})
        assert response.status_code == 422

    def test_predict_disease_model_not_loaded(self, client_no_models):
        """When models are not loaded, should return 503."""
        response = client_no_models.post(
            "/predict/disease",
            json={"symptoms": {"cough": 1}},
        )
        assert response.status_code == 503
        body = response.json()
        assert body["success"] is False
        assert body["error"]["code"] == "MODEL_NOT_LOADED"
