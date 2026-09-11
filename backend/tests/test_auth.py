import json
import pytest
from pathlib import Path

@pytest.fixture(autouse=True)
def tmp_users(tmp_path, monkeypatch):
    p = tmp_path / "users.json"
    p.write_text("[]", encoding="utf-8")
    import auth
    monkeypatch.setattr(auth, "USERS_PATH", p)
    return p

def test_hash_and_verify_password():
    import auth
    hashed = auth.hash_password("secret")
    assert auth.verify_password("secret", hashed)
    assert not auth.verify_password("wrong", hashed)

def test_create_user_and_load(tmp_users):
    import auth
    auth.create_user("alice", "pass123", "estudante")
    users = json.loads(tmp_users.read_text(encoding="utf-8"))
    assert len(users) == 1
    assert users[0]["username"] == "alice"
    assert users[0]["role"] == "estudante"

def test_authenticate_user_success(tmp_users):
    import auth
    auth.create_user("bob", "mypass", "admin")
    user = auth.authenticate_user("bob", "mypass")
    assert user is not None
    assert user["role"] == "admin"

def test_authenticate_user_wrong_password(tmp_users):
    import auth
    auth.create_user("carol", "correct", "estudante")
    assert auth.authenticate_user("carol", "wrong") is None

def test_authenticate_user_not_found(tmp_users):
    import auth
    assert auth.authenticate_user("nobody", "pass") is None

def test_create_and_verify_token():
    import auth
    token = auth.create_token("diana", "professor")
    payload = auth.verify_token(token)
    assert payload["sub"] == "diana"
    assert payload["role"] == "professor"

def test_verify_token_invalid():
    import auth
    with pytest.raises(Exception):
        auth.verify_token("not.a.valid.token")


def test_load_users_returns_empty_list_when_file_missing(tmp_path, monkeypatch):
    import auth
    missing = tmp_path / "does_not_exist.json"
    monkeypatch.setattr(auth, "USERS_PATH", missing)
    assert auth._load_users() == []


def _clear_bootstrap_env(monkeypatch):
    for var in (
        "BOOTSTRAP_ADMIN_USERNAME",
        "BOOTSTRAP_ADMIN_PASSWORD",
        "BOOTSTRAP_ESTUDANTE_USERNAME",
        "BOOTSTRAP_ESTUDANTE_PASSWORD",
        "BOOTSTRAP_GRUPOS",
    ):
        monkeypatch.delenv(var, raising=False)


def test_ensure_bootstrap_users_creates_accounts_from_env(tmp_users, monkeypatch):
    import auth
    _clear_bootstrap_env(monkeypatch)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_USERNAME", "admin_boot")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "adminpass")
    monkeypatch.setenv("BOOTSTRAP_ESTUDANTE_USERNAME", "estudante_boot")
    monkeypatch.setenv("BOOTSTRAP_ESTUDANTE_PASSWORD", "estudantepass")

    auth.ensure_bootstrap_users()

    users = json.loads(tmp_users.read_text(encoding="utf-8"))
    usernames = {u["username"]: u["role"] for u in users}
    assert usernames == {"admin_boot": "admin", "estudante_boot": "estudante"}
    assert auth.authenticate_user("admin_boot", "adminpass") is not None
    assert auth.authenticate_user("estudante_boot", "estudantepass") is not None


def test_ensure_bootstrap_users_is_noop_for_existing_username(tmp_users, monkeypatch):
    import auth
    auth.create_user("admin_boot", "originalpass", "admin")

    _clear_bootstrap_env(monkeypatch)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_USERNAME", "admin_boot")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "newpass")

    auth.ensure_bootstrap_users()

    users = json.loads(tmp_users.read_text(encoding="utf-8"))
    assert len(users) == 1
    assert auth.authenticate_user("admin_boot", "originalpass") is not None
    assert auth.authenticate_user("admin_boot", "newpass") is None


def test_ensure_bootstrap_users_noop_when_env_vars_unset(tmp_users, monkeypatch):
    import auth
    _clear_bootstrap_env(monkeypatch)

    auth.ensure_bootstrap_users()

    users = json.loads(tmp_users.read_text(encoding="utf-8"))
    assert users == []


def test_ensure_bootstrap_users_creates_one_estudante_account_per_group(tmp_users, monkeypatch):
    import auth
    _clear_bootstrap_env(monkeypatch)
    monkeypatch.setenv("BOOTSTRAP_GRUPOS", "grupo01:senha-um,grupo02:senha_dois")

    auth.ensure_bootstrap_users()

    users = json.loads(tmp_users.read_text(encoding="utf-8"))
    assert {u["username"]: u["role"] for u in users} == {"grupo01": "estudante", "grupo02": "estudante"}
    assert auth.authenticate_user("grupo01", "senha-um") is not None
    assert auth.authenticate_user("grupo02", "senha_dois") is not None
    assert auth.authenticate_user("grupo01", "senha_dois") is None


def test_ensure_bootstrap_users_keeps_existing_group_password(tmp_users, monkeypatch):
    import auth
    auth.create_user("grupo01", "senha-original", "estudante")
    _clear_bootstrap_env(monkeypatch)
    monkeypatch.setenv("BOOTSTRAP_GRUPOS", "grupo01:senha-nova,grupo02:senha_dois")

    auth.ensure_bootstrap_users()

    users = json.loads(tmp_users.read_text(encoding="utf-8"))
    assert [u["username"] for u in users] == ["grupo01", "grupo02"]
    assert auth.authenticate_user("grupo01", "senha-original") is not None
    assert auth.authenticate_user("grupo01", "senha-nova") is None


def test_ensure_bootstrap_users_skips_malformed_groups_and_tolerates_whitespace(tmp_users, monkeypatch):
    import auth
    _clear_bootstrap_env(monkeypatch)
    monkeypatch.setenv(
        "BOOTSTRAP_GRUPOS",
        " grupo01:senha-um ,\ngrupo02 , ,:sem-usuario,grupo03:,grupo04:senha:com:dois-pontos",
    )

    auth.ensure_bootstrap_users()

    users = json.loads(tmp_users.read_text(encoding="utf-8"))
    assert sorted(u["username"] for u in users) == ["grupo01", "grupo04"]
    assert auth.authenticate_user("grupo01", "senha-um") is not None
    assert auth.authenticate_user("grupo04", "senha:com:dois-pontos") is not None
