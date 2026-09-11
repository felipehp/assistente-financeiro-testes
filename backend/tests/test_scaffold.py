import json
from pathlib import Path

BACKEND = Path(__file__).parent.parent

def test_config_json_has_required_keys():
    cfg = json.loads((BACKEND / "config.json").read_text(encoding="utf-8"))
    required = (
        "system_prompt", "llm_provider", "llm_model",
        "llm_temperature", "llm_max_tokens",
        "embed_provider", "embed_model",
        "rag_retrieval_k", "rag_chunk_size", "rag_score_threshold",
    )
    for key in required:
        assert key in cfg, f"config.json missing key: {key}"

def test_env_example_has_api_key_placeholders():
    content = (BACKEND / ".env.example").read_text(encoding="utf-8")
    for key in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_API_KEY"):
        assert key in content

def test_users_json_is_valid_schema():
    users = json.loads((BACKEND / "users.json").read_text(encoding="utf-8"))
    assert isinstance(users, list)
    for user in users:
        assert "username" in user, f"user entry missing 'username': {user}"
        assert "password" in user, f"user entry missing 'password': {user}"
        assert "role" in user, f"user entry missing 'role': {user}"
        assert user["role"] in ("admin", "professor", "estudante"), f"invalid role: {user['role']}"

def test_docs_directory_exists():
    assert (BACKEND / "docs").is_dir()
