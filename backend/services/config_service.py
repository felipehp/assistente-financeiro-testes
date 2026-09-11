import json
import os
from pathlib import Path
from filelock import FileLock

CONFIG_PATH = Path(__file__).parent.parent / "config.json"
_LOCK_PATH = CONFIG_PATH.with_suffix(".lock")

_cache: dict = {}

def read_config() -> dict:
    mtime = CONFIG_PATH.stat().st_mtime
    if _cache.get("mtime") == mtime:
        return _cache["data"]
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    _cache["mtime"] = mtime
    _cache["data"] = data
    return data

def write_config(data: dict) -> None:
    tmp = CONFIG_PATH.with_suffix(".tmp")
    with FileLock(str(_LOCK_PATH)):
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, CONFIG_PATH)
    _cache.clear()
