import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from unittest.mock import patch


def _token(role="estudante"):
    import auth
    return auth.create_token("u", role)


def test_post_message_feedback(tmp_path, monkeypatch):
    import routers.feedback as fb_module
    p = tmp_path / "feedback.jsonl"
    monkeypatch.setattr(fb_module, "FEEDBACK_PATH", p)
    from main import app
    client = TestClient(app)
    payload = {
        "type": "message",
        "message_id": "uuid-1",
        "question": "Qual o prazo?",
        "answer": "O prazo é 30 dias.",
        "sources": ["normas.pdf"],
        "rating": "up"
    }
    resp = client.post("/feedback", json=payload, headers={"Authorization": f"Bearer {_token()}"})
    assert resp.status_code == 200
    assert p.exists()


def test_post_session_feedback(tmp_path, monkeypatch):
    import routers.feedback as fb_module
    p = tmp_path / "feedback.jsonl"
    monkeypatch.setattr(fb_module, "FEEDBACK_PATH", p)
    from main import app
    client = TestClient(app)
    payload = {"type": "session", "emoji": "happy", "message_count": 5}
    resp = client.post("/feedback", json=payload, headers={"Authorization": f"Bearer {_token()}"})
    assert resp.status_code == 200


def test_get_feedback_requires_professor_or_admin():
    from main import app
    client = TestClient(app)
    resp = client.get("/feedback", headers={"Authorization": f"Bearer {_token('estudante')}"})
    assert resp.status_code == 403


def test_get_feedback_returns_summary(tmp_path, monkeypatch):
    import routers.feedback as fb_module
    p = tmp_path / "feedback.jsonl"
    records = [
        {"type": "message", "session_id": "s1", "role": "estudante", "message_id": "m1",
         "question": "Qual prazo?", "answer": "30 dias", "sources": ["normas.pdf"], "rating": "up",
         "timestamp": "2026-05-19T14:00:00Z"},
        {"type": "session", "session_id": "s1", "role": "estudante", "emoji": "happy",
         "message_count": 3, "timestamp": "2026-05-19T14:01:00Z"},
    ]
    p.write_text("\n".join(json.dumps(r) for r in records), encoding="utf-8")
    monkeypatch.setattr(fb_module, "FEEDBACK_PATH", p)
    from main import app
    client = TestClient(app)
    resp = client.get("/feedback", headers={"Authorization": f"Bearer {_token('professor')}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "sessions" in data
    assert "negative_messages" in data
