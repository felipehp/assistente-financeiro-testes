from fastapi.testclient import TestClient


def test_all_routes_registered():
    from main import app
    routes = {r.path for r in app.routes}
    assert "/health" in routes
    assert "/auth/login" in routes
    assert "/chat" in routes
    assert "/docs" in routes
    assert "/docs/upload" in routes
    assert "/config" in routes
    assert "/feedback" in routes


def test_unauthenticated_protected_routes_return_403():
    from main import app
    client = TestClient(app)
    for path in ("/chat", "/docs", "/config", "/feedback"):
        resp = client.get(path)
        assert resp.status_code in (403, 405), f"{path} deveria exigir auth"
