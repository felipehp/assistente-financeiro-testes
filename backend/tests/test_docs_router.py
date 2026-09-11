import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


def _token(role="professor"):
    import auth
    return auth.create_token("admin", role)


def test_list_docs_requires_auth():
    from main import app
    client = TestClient(app)
    resp = client.get("/docs")
    assert resp.status_code == 403


def test_list_docs_empty():
    from main import app
    client = TestClient(app)
    with patch("services.ingest_service.list_documents", return_value=[]):
        resp = client.get("/docs", headers={"Authorization": f"Bearer {_token()}"})
    assert resp.status_code == 200
    assert resp.json() == []


def test_upload_rejects_invalid_type():
    from main import app
    client = TestClient(app)
    fake = io.BytesIO(b"not a pdf")
    resp = client.post("/docs/upload",
                       files={"file": ("script.exe", fake, "application/octet-stream")},
                       headers={"Authorization": f"Bearer {_token()}"})
    assert resp.status_code == 422


def test_upload_rejects_estudante():
    from main import app
    client = TestClient(app)
    fake = io.BytesIO(b"%PDF-1.4")
    resp = client.post("/docs/upload",
                       files={"file": ("doc.pdf", fake, "application/pdf")},
                       headers={"Authorization": f"Bearer {_token('estudante')}"})
    assert resp.status_code == 403


def test_delete_requires_professor_or_admin():
    from main import app
    client = TestClient(app)
    resp = client.delete("/docs/someid", headers={"Authorization": f"Bearer {_token('estudante')}"})
    assert resp.status_code == 403
