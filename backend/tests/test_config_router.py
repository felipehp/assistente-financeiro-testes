import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient


def _admin_token():
    import auth
    return auth.create_token("admin", "admin")


def _professor_token():
    import auth
    return auth.create_token("coord", "professor")


@pytest.fixture(autouse=True)
def setup_users(tmp_path, monkeypatch):
    p = tmp_path / "users.json"
    p.write_text("[]", encoding="utf-8")
    import auth
    monkeypatch.setattr(auth, "USERS_PATH", p)
    auth.create_user("admin", "adminpass", "admin")
    auth.create_user("coord", "coordpass", "professor")


def test_get_config_requires_admin():
    from main import app
    client = TestClient(app)
    resp = client.get("/config", headers={"Authorization": f"Bearer {_professor_token()}"})
    assert resp.status_code == 403


def test_get_config_masks_api_keys(monkeypatch):
    from main import app
    client = TestClient(app)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-abcd1234")
    resp = client.get("/config", headers={"Authorization": f"Bearer {_admin_token()}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "system_prompt" in data
    assert data["anthropic_api_key"] == "***1234"


def test_put_config_saves(monkeypatch):
    from main import app
    client = TestClient(app)
    new_cfg = {
        "system_prompt": "novo prompt",
        "llm_provider": "openai",
        "llm_model": "gpt-4o",
        "embed_provider": "openai",
        "embed_model": "text-embedding-3-small"
    }
    with patch("services.config_service.write_config") as mock_write:
        resp = client.put("/config", json=new_cfg, headers={"Authorization": f"Bearer {_admin_token()}"})
    assert resp.status_code == 200
    mock_write.assert_called_once()


def test_get_config_returns_ml_params(monkeypatch):
    from main import app
    client = TestClient(app)
    resp = client.get("/config", headers={"Authorization": f"Bearer {_admin_token()}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "llm_temperature" in data
    assert "llm_max_tokens" in data
    assert "rag_retrieval_k" in data
    assert "rag_chunk_size" in data
    assert "rag_score_threshold" in data
    assert data["llm_temperature"] == pytest.approx(0.3)


def test_put_config_saves_ml_params():
    from main import app
    client = TestClient(app)
    payload = {
        "system_prompt": "teste",
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        "embed_provider": "openai",
        "embed_model": "text-embedding-3-small",
        "llm_temperature": 0.1,
        "llm_max_tokens": 512,
        "rag_retrieval_k": 4,
        "rag_chunk_size": 600,
        "rag_score_threshold": 0.5,
    }
    with patch("services.config_service.write_config") as mock_write:
        resp = client.put("/config", json=payload,
                          headers={"Authorization": f"Bearer {_admin_token()}"})
    assert resp.status_code == 200
    saved = mock_write.call_args[0][0]
    assert saved["llm_temperature"] == pytest.approx(0.1)
    assert saved["rag_retrieval_k"] == 4
    assert saved["rag_score_threshold"] == pytest.approx(0.5)


def test_put_config_rejects_invalid_temperature():
    from main import app
    client = TestClient(app)
    payload = {
        "system_prompt": "teste",
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        "embed_provider": "openai",
        "embed_model": "text-embedding-3-small",
        "llm_temperature": 2.0,  # inválido: max é 1.0
    }
    resp = client.put("/config", json=payload,
                      headers={"Authorization": f"Bearer {_admin_token()}"})
    assert resp.status_code == 422


def test_put_config_omits_none_fields():
    """Campos opcionais não enviados não devem sobrescrever valores existentes."""
    from main import app
    client = TestClient(app)
    payload = {
        "system_prompt": "só prompt",
        "llm_provider": "google",
        "llm_model": "gemini-2.5-flash",
        "embed_provider": "google",
        "embed_model": "models/gemini-embedding-001",
        # llm_temperature não enviado — não deve virar None no config
    }
    captured = {}
    def fake_write(data):
        captured.update(data)

    with patch("services.config_service.write_config", side_effect=fake_write):
        resp = client.put("/config", json=payload,
                          headers={"Authorization": f"Bearer {_admin_token()}"})
    assert resp.status_code == 200
    assert "llm_temperature" not in captured or captured.get("llm_temperature") is not None
