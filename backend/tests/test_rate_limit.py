import time
import pytest
from services import rate_limit


def setup_function():
    rate_limit.reset()


def test_allows_requests_under_limit():
    for _ in range(5):
        rate_limit.check_rate_limit("aluno1", max_requests=5, window_seconds=60)


def test_blocks_request_over_limit():
    for _ in range(5):
        rate_limit.check_rate_limit("aluno1", max_requests=5, window_seconds=60)
    with pytest.raises(rate_limit.RateLimitExceeded):
        rate_limit.check_rate_limit("aluno1", max_requests=5, window_seconds=60)


def test_limit_is_per_key():
    for _ in range(5):
        rate_limit.check_rate_limit("aluno1", max_requests=5, window_seconds=60)
    rate_limit.check_rate_limit("aluno2", max_requests=5, window_seconds=60)


def test_window_expires(monkeypatch):
    fake_time = [1000.0]
    monkeypatch.setattr(time, "monotonic", lambda: fake_time[0])
    for _ in range(5):
        rate_limit.check_rate_limit("aluno1", max_requests=5, window_seconds=60)
    fake_time[0] += 61
    rate_limit.check_rate_limit("aluno1", max_requests=5, window_seconds=60)
