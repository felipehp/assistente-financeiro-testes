from pathlib import Path
from typing import Any

import chromadb
from langchain_classic.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_chroma import Chroma
from langchain_core.documents import Document

from services.config_service import read_config

CHROMA_PATH = Path(__file__).parent.parent / "chroma_db"
COLLECTION_NAME = "neuroguia"


def _get_collection_count() -> int:
    client = chromadb.PersistentClient(str(CHROMA_PATH))
    try:
        col = client.get_collection(COLLECTION_NAME)
        return col.count()
    except Exception:
        return 0


def _build_ensemble(embeddings: Any, n_candidates: int) -> EnsembleRetriever:
    chroma_client = chromadb.PersistentClient(str(CHROMA_PATH))
    vectorstore = Chroma(
        client=chroma_client,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
    )
    chroma_retriever = vectorstore.as_retriever(search_kwargs={"k": n_candidates})

    all_docs_result = chroma_client.get_collection(COLLECTION_NAME).get(
        include=["documents", "metadatas"]
    )
    bm25_docs = [
        Document(page_content=text, metadata=meta)
        for text, meta in zip(all_docs_result["documents"], all_docs_result["metadatas"])
    ]
    bm25_retriever = BM25Retriever.from_documents(bm25_docs, k=n_candidates)

    return EnsembleRetriever(
        retrievers=[bm25_retriever, chroma_retriever],
        weights=[0.4, 0.6],
    )


def retrieve(query: str, embeddings: Any) -> list[Document]:
    cfg = read_config()
    k = cfg.get("rag_retrieval_k", 6)

    if _get_collection_count() == 0:
        return []

    ensemble = _build_ensemble(embeddings, k)
    return ensemble.invoke(query)


def extract_sources(docs: list[Document]) -> list[str]:
    if not docs:
        return ["Sem identificação da fonte"]
    seen: list[str] = []
    for doc in docs:
        src = doc.metadata.get("source", "")
        if src and src not in seen:
            seen.append(src)
    return seen or ["Sem identificação da fonte"]
