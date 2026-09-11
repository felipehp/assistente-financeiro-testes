import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def setup_users(tmp_path, monkeypatch):
    p = tmp_path / "users.json"
    p.write_text("[]", encoding="utf-8")
    import auth
    monkeypatch.setattr(auth, "USERS_PATH", p)
    auth.create_user("testuser", "testpass", "estudante")


def test_login_success():
    from main import app
    client = TestClient(app)
    resp = client.post("/auth/login", json={"username": "testuser", "password": "testpass"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "estudante"


def test_login_wrong_password():
    from main import app
    client = TestClient(app)
    resp = client.post("/auth/login", json={"username": "testuser", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_user():
    from main import app
    client = TestClient(app)
    resp = client.post("/auth/login", json={"username": "ghost", "password": "pass"})
    assert resp.status_code == 401
