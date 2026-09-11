import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sse_starlette.sse import EventSourceResponse

import auth as auth_module
from services import ingest_service
from providers import get_embeddings

router = APIRouter(prefix="/docs", tags=["docs"])
security = HTTPBearer(auto_error=False)

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
SUFFIX_MAP = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


def _require_role(*roles: str):
    def dep(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
        if credentials is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token ausente")
        try:
            user = auth_module.verify_token(credentials.credentials)
        except Exception:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token inválido")
        if user["role"] not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão")
        return user
    return dep


@router.get("")
async def list_docs(user: dict = Depends(_require_role("professor", "admin"))):
    return ingest_service.list_documents()


@router.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(_require_role("professor", "admin"))):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=422, detail=f"Tipo não aceito: {file.content_type}")
    content = await file.read()
    if len(content) > ingest_service.MAX_BYTES:
        raise HTTPException(status_code=422, detail="Arquivo maior que 20 MB")
    suffix = SUFFIX_MAP[file.content_type]
    docs_dir = ingest_service.DOCS_PATH
    dest = docs_dir / (Path(file.filename).stem + suffix)
    dest.write_bytes(content)
    return {"filename": dest.name, "size": len(content)}


@router.post("/ingest")
async def ingest(user: dict = Depends(_require_role("professor", "admin"))):
    if not ingest_service.list_pending_files():
        raise HTTPException(status_code=404, detail="Nenhum arquivo encontrado em docs/")

    try:
        embeddings = get_embeddings()
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    queue: asyncio.Queue = asyncio.Queue()

    async def process():
        await ingest_service.ingest_pending_files(embeddings, queue)
        await queue.put(None)

    task = asyncio.create_task(process())

    async def stream():
        while True:
            item = await queue.get()
            if item is None:
                yield {"event": "done", "data": "{}"}
                break
            yield {"data": json.dumps(item, ensure_ascii=False)}

    return EventSourceResponse(stream())


@router.delete("/{source_id}")
async def delete_doc(source_id: str, user: dict = Depends(_require_role("professor", "admin"))):
    removed = ingest_service.delete_by_source_id(source_id)
    if removed == 0:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return {"deleted": removed}
