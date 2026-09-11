import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient


def _make_token():
    import auth
    return auth.create_token("testuser", "estudante")


def test_chat_cold_start_returns_friendly_message():
    from main import app
    client = TestClient(app)
    token = _make_token()
    with patch("services.rag_service._get_collection_count", return_value=0):
        with client.stream("POST", "/chat",
                           json={"message": "oi", "history": []},
                           headers={"Authorization": f"Bearer {token}"}) as r:
            assert r.status_code == 200
            lines = list(r.iter_lines())
            data_lines = [l for l in lines if l.startswith("data:")]
            assert len(data_lines) >= 1
            payload = json.loads(data_lines[0].removeprefix("data: "))
            assert payload["movement"] in ("talking", "thinking")


def test_chat_requires_auth():
    from main import app
    client = TestClient(app)
    resp = client.post("/chat", json={"message": "oi", "history": []})
    assert resp.status_code == 403


def test_chat_returns_429_when_rate_limited():
    from main import app
    from services import rate_limit
    rate_limit.reset()
    client = TestClient(app)
    token = _make_token()
    with patch("services.rag_service._get_collection_count", return_value=0):
        for _ in range(20):
            client.post("/chat", json={"message": "oi", "history": []},
                        headers={"Authorization": f"Bearer {token}"})
        resp = client.post("/chat", json={"message": "oi", "history": []},
                           headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 429
    assert "Retry-After" in resp.headers
    rate_limit.reset()
