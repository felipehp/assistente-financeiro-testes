import time
from collections import defaultdict
from threading import Lock

_WINDOW_SECONDS = 60
_MAX_REQUESTS = 20

_lock = Lock()
_hits: dict[str, list[float]] = defaultdict(list)


class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(f"rate limit exceeded, retry after {retry_after}s")


def check_rate_limit(key: str, max_requests: int = _MAX_REQUESTS, window_seconds: int = _WINDOW_SECONDS) -> None:
    now = time.monotonic()
    with _lock:
        hits = _hits[key]
        cutoff = now - window_seconds
        while hits and hits[0] < cutoff:
            hits.pop(0)
        if len(hits) >= max_requests:
            raise RateLimitExceeded(retry_after=int(window_seconds - (now - hits[0])) + 1)
        hits.append(now)


def reset() -> None:
    """Test helper: limpa todo o estado do limitador."""
    with _lock:
        _hits.clear()
