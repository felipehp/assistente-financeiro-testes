import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import bcrypt
from jose import JWTError, jwt

USERS_PATH = Path(__file__).parent / "users.json"
SECRET_KEY = os.getenv("JWT_SECRET", "neuroguia-dev-secret-change-in-prod")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 30


def _load_users() -> list[dict]:
    if not USERS_PATH.exists():
        return []
    return json.loads(USERS_PATH.read_text(encoding="utf-8"))


def _save_users(users: list[dict]) -> None:
    USERS_PATH.write_text(json.dumps(users, ensure_ascii=False, indent=2), encoding="utf-8")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
        return bcrypt.checkpw(password.encode(), hashed.encode())
    return password == hashed


def create_user(username: str, password: str, role: str) -> None:
    users = _load_users()
    users.append({"username": username, "password": hash_password(password), "role": role})
    _save_users(users)


def _parse_group_accounts(raw: str) -> list[tuple[str, str]]:
    """Parse BOOTSTRAP_GRUPOS ("grupo01:senha,grupo02:senha"). Splits each entry on the
    first ":" and skips entries missing a username or a password."""
    accounts = []
    for entry in raw.split(","):
        username, _, password = entry.strip().partition(":")
        username, password = username.strip(), password.strip()
        if username and password:
            accounts.append((username, password))
    return accounts


def ensure_bootstrap_users() -> None:
    """Idempotently create accounts from env vars on startup. Safe to call on every boot —
    skips any username that already exists. Designed for hosting with no persistent disk,
    where users.json is recreated from scratch on every cold start.

    BOOTSTRAP_GRUPOS creates one 'estudante' account per student group."""
    existing = {u["username"] for u in _load_users()}
    accounts = []
    for prefix, role in (("BOOTSTRAP_ADMIN", "admin"), ("BOOTSTRAP_ESTUDANTE", "estudante")):
        username = os.getenv(f"{prefix}_USERNAME")
        password = os.getenv(f"{prefix}_PASSWORD")
        if username and password:
            accounts.append((username, password, role))
    for username, password in _parse_group_accounts(os.getenv("BOOTSTRAP_GRUPOS", "")):
        accounts.append((username, password, "estudante"))

    for username, password, role in accounts:
        if username not in existing:
            create_user(username, password, role)
            existing.add(username)


def authenticate_user(username: str, password: str) -> Optional[dict]:
    for user in _load_users():
        if user["username"] == username and verify_password(password, user["password"]):
            return user
    return None


def create_token(username: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": username, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError(f"Token invalido: {e}") from e
