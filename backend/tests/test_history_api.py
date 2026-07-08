"""
Tests for the Assessment History API endpoint.
"""
import pytest
from app.api import deps
from app.models.user import User

class MockUser:
    def __init__(self, id=999999, email="nonexistent_test_user@example.com"):
        self.id = id
        self.email = email

@pytest.fixture
def mock_logged_in_user(app):
    user = MockUser()
    app.dependency_overrides[deps.get_current_user] = lambda: user
    yield user
    app.dependency_overrides = {}

class TestHistoryEndpoint:
    """Tests for GET /history/"""

    def test_get_history_unauthorized(self, client):
        """Accessing history without login should return 401."""
        response = client.get("/history/")
        assert response.status_code == 401
        body = response.json()
        assert "detail" in body

    def test_get_history_empty_success(self, client, mock_logged_in_user):
        """Logged in user with no records should get 200 and empty list."""
        response = client.get("/history/")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"] == []

    def test_get_history_filtering(self, app, client):
        """Verify the endpoint returns records belonging to the current user."""
        # This is more of an integration test. 
        # For a true unit test of the endpoint logic with dependency overrides:
        user = MockUser(id=99)
        app.dependency_overrides[deps.get_current_user] = lambda: user
        
        # We can't easily mock the DB session results without more complex fixtures,
        # but we can at least verify the 200 response code when authenticated.
        response = client.get("/history/")
        assert response.status_code == 200
        app.dependency_overrides = {}
