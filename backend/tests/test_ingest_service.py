import asyncio
import hashlib
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock


@pytest.fixture
def txt_file(tmp_path):
    f = tmp_path / "sample.txt"
    f.write_text(
        "Artigo 1. O prazo de matrícula é de 30 dias.\n\nArtigo 2. O aluno deve apresentar laudo médico.",
        encoding="utf-8",
    )
    return f


def test_compute_sha256(txt_file):
    from services.ingest_service import compute_sha256

    h = compute_sha256(txt_file)
    expected = hashlib.sha256(txt_file.read_bytes()).hexdigest()
    assert h == expected


def test_load_and_chunk_txt(txt_file):
    from services.ingest_service import load_and_chunk

    chunks = load_and_chunk(txt_file, source_id="abc123")
    assert len(chunks) >= 1
    for c in chunks:
        assert c.metadata["source"] == "sample.txt"
        assert c.metadata["source_id"] == "abc123"
        assert len(c.page_content) > 0


def test_is_duplicate_false_for_new_source(tmp_path):
    import chromadb
    from services.ingest_service import is_duplicate

    client = chromadb.EphemeralClient()
    col = client.get_or_create_collection("test")
    assert not is_duplicate("newid", col)


def test_is_duplicate_true_for_existing(tmp_path):
    import chromadb
    from services.ingest_service import is_duplicate

    client = chromadb.EphemeralClient()
    col = client.get_or_create_collection("test")
    col.add(ids=["doc1"], documents=["text"], metadatas=[{"source_id": "sha256abc"}])
    assert is_duplicate("sha256abc", col)


def test_load_and_chunk_uses_chunk_size_from_config(txt_file):
    from unittest.mock import patch, MagicMock
    from services import ingest_service

    with patch("services.ingest_service.read_config", return_value={"rag_chunk_size": 600}), \
         patch("services.ingest_service.RecursiveCharacterTextSplitter") as mock_splitter_cls:

        mock_splitter = MagicMock()
        mock_splitter.split_documents.return_value = []
        mock_splitter_cls.return_value = mock_splitter

        ingest_service.load_and_chunk(txt_file, "abc")

    mock_splitter_cls.assert_called_once_with(
        chunk_size=600,
        chunk_overlap=round(600 * 0.17),
        separators=["\n\n", "\n", "Art.", "§", ". ", " "],
    )


@pytest.fixture
def docs_dir(tmp_path, monkeypatch):
    from services import ingest_service
    d = tmp_path / "docs"
    d.mkdir()
    monkeypatch.setattr(ingest_service, "DOCS_PATH", d)
    return d


def test_ingest_pending_files_returns_empty_list_when_no_files(docs_dir):
    from services import ingest_service

    (docs_dir / ".gitkeep").write_text("", encoding="utf-8")

    result = asyncio.run(ingest_service.ingest_pending_files(embeddings=MagicMock(), progress_queue=None))
    assert result == []


def test_ingest_pending_files_ingests_each_pending_file(docs_dir):
    from services import ingest_service

    (docs_dir / "a.txt").write_text("conteudo a", encoding="utf-8")
    (docs_dir / "b.pdf").write_text("conteudo b", encoding="utf-8")
    (docs_dir / ".gitkeep").write_text("", encoding="utf-8")

    async def fake_ingest_file(path, embeddings, progress_queue):
        return {"file": path.name, "status": "ok", "chunks": 1}

    with patch("services.ingest_service.ingest_file", AsyncMock(side_effect=fake_ingest_file)) as mock_ingest:
        result = asyncio.run(ingest_service.ingest_pending_files(embeddings=MagicMock(), progress_queue=None))

    assert mock_ingest.await_count == 2
    assert {r["file"] for r in result} == {"a.txt", "b.pdf"}
    assert all(r["status"] == "ok" for r in result)


def test_ingest_pending_files_uses_given_progress_queue(docs_dir):
    from services import ingest_service

    (docs_dir / "a.txt").write_text("conteudo a", encoding="utf-8")

    async def fake_ingest_file(path, embeddings, progress_queue):
        assert progress_queue is queue
        return {"file": path.name, "status": "ok", "chunks": 1}

    queue: asyncio.Queue = asyncio.Queue()
    with patch("services.ingest_service.ingest_file", AsyncMock(side_effect=fake_ingest_file)):
        asyncio.run(ingest_service.ingest_pending_files(embeddings=MagicMock(), progress_queue=queue))


def test_ingest_pending_files_records_error_for_failed_file(docs_dir):
    from services import ingest_service

    (docs_dir / "broken.txt").write_text("x", encoding="utf-8")

    async def failing(path, embeddings, progress_queue):
        raise ValueError("boom")

    with patch("services.ingest_service.ingest_file", AsyncMock(side_effect=failing)):
        result = asyncio.run(ingest_service.ingest_pending_files(embeddings=MagicMock(), progress_queue=None))

    assert len(result) == 1
    assert result[0]["file"] == "broken.txt"
    assert result[0]["status"] == "error"


def test_ensure_corpus_ingested_skips_when_collection_has_content():
    from services import ingest_service

    with patch("services.ingest_service._get_collection_count", return_value=5), \
         patch("services.ingest_service.ingest_pending_files", AsyncMock()) as mock_ingest_pending:
        asyncio.run(ingest_service.ensure_corpus_ingested(embeddings=MagicMock()))

    mock_ingest_pending.assert_not_called()


def test_ensure_corpus_ingested_ingests_when_collection_empty():
    from services import ingest_service

    embeddings = MagicMock()
    with patch("services.ingest_service._get_collection_count", return_value=0), \
         patch("services.ingest_service.ingest_pending_files", AsyncMock()) as mock_ingest_pending:
        asyncio.run(ingest_service.ensure_corpus_ingested(embeddings=embeddings))

    mock_ingest_pending.assert_awaited_once_with(embeddings, progress_queue=None)
