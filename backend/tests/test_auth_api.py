"""
Tests for the Authentication API endpoints.
"""
import uuid
import pytest
from app.db.database import SessionLocal
from app.models.user import User

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_user_factory(db_session):
    emails = []
    def _create_user(email, password="Password123!"):
        emails.append(email)
        from app.core import security
        hashed_password = security.get_password_hash(password)
        db_user = User(email=email, hashed_password=hashed_password)
        db_session.add(db_user)
        db_session.commit()
        db_session.refresh(db_user)
        return db_user
        
    yield _create_user
    
    # Cleanup after test
    for email in emails:
        db_session.query(User).filter(User.email == email).delete()
    db_session.commit()

def test_register_user_success(client, db_session):
    email = f"register_success_{uuid.uuid4().hex}@example.com"
    try:
        response = client.post("/auth/register", json={"email": email, "password": "Password123!"})
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["email"] == email
    finally:
        # Cleanup
        db_session.query(User).filter(User.email == email).delete()
        db_session.commit()

def test_register_user_duplicate(client, test_user_factory):
    email = f"register_dup_{uuid.uuid4().hex}@example.com"
    # Pre-create the user
    test_user_factory(email)
    
    # Attempt to register again
    response = client.post("/auth/register", json={"email": email, "password": "Password123!"})
    assert response.status_code == 400
    body = response.json()
    assert "already exists" in body["detail"]

def test_login_success(client, test_user_factory):
    email = f"login_success_{uuid.uuid4().hex}@example.com"
    test_user_factory(email, password="MySecretPassword123!")
    
    response = client.post("/auth/login", data={"username": email, "password": "MySecretPassword123!"})
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"

def test_login_incorrect_password(client, test_user_factory):
    email = f"login_wrong_pass_{uuid.uuid4().hex}@example.com"
    test_user_factory(email, password="MySecretPassword123!")
    
    response = client.post("/auth/login", data={"username": email, "password": "WrongPassword!"})
    assert response.status_code == 401
    body = response.json()
    assert body["detail"] == "Incorrect email or password"

def test_login_nonexistent_user(client):
    email = f"nonexistent_{uuid.uuid4().hex}@example.com"
    
    response = client.post("/auth/login", data={"username": email, "password": "Password123!"})
    assert response.status_code == 401
    body = response.json()
    assert body["detail"] == "No account. Sign up as a new user"

def test_google_auth_invalid_token(client):
    response = client.post("/auth/google", json={"id_token": "invalid_mock_token"})
    assert response.status_code == 400
    body = response.json()
    assert "Invalid Google ID token" in body["detail"]
