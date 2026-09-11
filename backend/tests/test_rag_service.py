import pytest
from unittest.mock import MagicMock, patch
from langchain_core.documents import Document


def _make_doc(content: str, source: str = "test.pdf") -> Document:
    return Document(page_content=content, metadata={"source": source, "source_id": "abc"})


def test_retrieve_returns_empty_for_empty_collection():
    from services.rag_service import retrieve
    with patch("services.rag_service._get_collection_count", return_value=0):
        docs = retrieve("qualquer pergunta", embeddings=MagicMock())
    assert docs == []


def test_retrieve_sources_from_metadata():
    from services.rag_service import extract_sources
    docs = [_make_doc("texto", "normas.pdf"), _make_doc("outro", "decreto.pdf"), _make_doc("rep", "normas.pdf")]
    sources = extract_sources(docs)
    assert sources == ["normas.pdf", "decreto.pdf"]


def test_extract_sources_empty():
    from services.rag_service import extract_sources
    assert extract_sources([]) == ["Sem identificação da fonte"]


def test_retrieve_uses_retrieval_k_from_config():
    from services.rag_service import retrieve

    doc1 = _make_doc("content 1")

    with patch("services.rag_service._get_collection_count", return_value=1), \
         patch("services.rag_service.read_config",
               return_value={"rag_retrieval_k": 3}), \
         patch("services.rag_service._build_ensemble") as mock_ensemble:

        mock_ens = MagicMock()
        mock_ens.invoke.return_value = [doc1]
        mock_ensemble.return_value = mock_ens

        result = retrieve("query", embeddings=MagicMock())

    mock_ensemble.assert_called_once()
    call_args = mock_ensemble.call_args[0]
    assert call_args[1] == 3
    assert result == [doc1]
