from fastapi.testclient import TestClient

def test_health_returns_ok():
    from main import app
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "chromadb" in data

def test_health_chromadb_field_is_string():
    from main import app
    client = TestClient(app)
    resp = client.get("/health")
    assert isinstance(resp.json()["chromadb"], str)
