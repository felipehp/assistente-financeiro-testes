import json
import pytest
from pathlib import Path

@pytest.fixture
def tmp_config(tmp_path):
    cfg = {"system_prompt": "test", "llm_provider": "anthropic",
           "llm_model": "claude-haiku-4-5-20251001", "embed_provider": "openai",
           "embed_model": "text-embedding-3-small"}
    p = tmp_path / "config.json"
    p.write_text(json.dumps(cfg), encoding="utf-8")
    return p

def test_read_config_returns_dict(tmp_config, monkeypatch):
    from services import config_service
    monkeypatch.setattr(config_service, "CONFIG_PATH", tmp_config)
    cfg = config_service.read_config()
    assert cfg["llm_provider"] == "anthropic"

def test_read_config_uses_cache(tmp_config, monkeypatch):
    from services import config_service
    monkeypatch.setattr(config_service, "CONFIG_PATH", tmp_config)
    config_service._cache.clear()
    cfg1 = config_service.read_config()
    cfg2 = config_service.read_config()
    assert cfg1 is cfg2

def test_write_config_is_atomic(tmp_config, monkeypatch):
    from services import config_service
    monkeypatch.setattr(config_service, "CONFIG_PATH", tmp_config)
    new_cfg = {"system_prompt": "updated", "llm_provider": "openai",
               "llm_model": "gpt-4o", "embed_provider": "openai",
               "embed_model": "text-embedding-3-small"}
    config_service.write_config(new_cfg)
    saved = json.loads(tmp_config.read_text(encoding="utf-8"))
    assert saved["llm_provider"] == "openai"

def test_write_config_invalidates_cache(tmp_config, monkeypatch):
    from services import config_service
    monkeypatch.setattr(config_service, "CONFIG_PATH", tmp_config)
    config_service.read_config()
    new_cfg = {"system_prompt": "new", "llm_provider": "google",
               "llm_model": "gemini-pro", "embed_provider": "openai",
               "embed_model": "text-embedding-3-small"}
    config_service.write_config(new_cfg)
    cfg = config_service.read_config()
    assert cfg["llm_provider"] == "google"
