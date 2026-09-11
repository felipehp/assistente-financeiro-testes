from fastapi.testclient import TestClient


def _get_health(origin: str) -> "TestClient.__enter__":
    from main import app
    client = TestClient(app)
    return client.get("/health", headers={"Origin": origin})


def test_allows_localhost_dev_origin():
    resp = _get_health("http://localhost:3000")
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_allows_production_vercel_origin():
    resp = _get_health("https://assistente-financeiro-testes.vercel.app")
    assert resp.headers.get("access-control-allow-origin") == "https://assistente-financeiro-testes.vercel.app"


def test_allows_vercel_preview_origin_via_regex():
    resp = _get_health("https://assistente-financeiro-testes-git-fix-abc123.vercel.app")
    assert resp.headers.get("access-control-allow-origin") == "https://assistente-financeiro-testes-git-fix-abc123.vercel.app"


def test_rejects_unrelated_origin():
    resp = _get_health("https://evil-example.com")
    assert resp.headers.get("access-control-allow-origin") is None


def test_rejects_suffix_spoofed_origin_via_exception_handler():
    # Regression test: the manual CORS fallback in the unhandled-exception
    # handler must fullmatch _ALLOWED_ORIGIN_REGEX, not just match a prefix.
    # A `re.match` (start-anchored only) would incorrectly let an origin like
    # "https://assistente-financeiro-testes.vercel.app.evil.com" through,
    # since it starts with a string the regex matches even though the whole
    # origin is attacker-controlled. This test exercises that fallback path
    # directly by forcing an unhandled exception.
    from main import app

    @app.get("/__trigger_500_for_test")
    async def _trigger():
        raise ValueError("boom")

    client = TestClient(app, raise_server_exceptions=False)
    resp = client.get(
        "/__trigger_500_for_test",
        headers={"Origin": "https://assistente-financeiro-testes.vercel.app.evil.com"},
    )
    assert resp.status_code == 500
    assert resp.headers.get("access-control-allow-origin") is None
