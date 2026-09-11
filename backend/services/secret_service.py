import json
import os
import stat
from pathlib import Path
from filelock import FileLock

_SECRETS_PATH = Path(__file__).resolve().parent.parent / "secrets.json"
_LOCK_PATH = _SECRETS_PATH.with_suffix(".lock")


def get_key(name: str) -> str:
    """Read a secret by name. Falls back to empty string if not found."""
    try:
        return json.loads(_SECRETS_PATH.read_text(encoding='utf-8')).get(name, '')
    except (FileNotFoundError, json.JSONDecodeError):
        return ''


def set_keys(updates: dict[str, str]) -> None:
    """Merge non-empty key updates into secrets.json atomically with FileLock."""
    with FileLock(str(_LOCK_PATH)):
        try:
            data = json.loads(_SECRETS_PATH.read_text(encoding='utf-8'))
        except (FileNotFoundError, json.JSONDecodeError):
            data = {}
        for name, value in updates.items():
            if value:
                data[name] = value
        tmp = _SECRETS_PATH.with_suffix('.tmp')
        tmp.write_text(json.dumps(data, indent=2), encoding='utf-8')
        os.replace(tmp, _SECRETS_PATH)
    # chmod 600 (owner read/write only) — no-op on Windows but harmless
    try:
        os.chmod(_SECRETS_PATH, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass
