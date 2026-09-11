import logging
import re
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request
from dotenv import load_dotenv
import auth as auth_module
from providers import get_embeddings
from routers import auth as auth_router
from routers import chat as chat_router
from routers import config as config_router
from routers import docs as docs_router
from routers import feedback as feedback_router
from services import ingest_service

_ALLOWED_ORIGINS = ["http://localhost:3000", "https://assistente-financeiro-testes.vercel.app"]
_ALLOWED_ORIGIN_REGEX = r"https://assistente-financeiro-testes.*\.vercel\.app"

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        auth_module.ensure_bootstrap_users()
    except Exception:
        logging.exception("Falha ao inicializar contas de bootstrap")
    try:
        embeddings = get_embeddings()
        await ingest_service.ensure_corpus_ingested(embeddings)
    except Exception:
        logging.exception("Falha ao inicializar corpus")
    yield


app = FastAPI(title="Assistente Aurora API", lifespan=lifespan, docs_url="/api-docs", redoc_url="/api-redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_origin_regex=_ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(config_router.router)
app.include_router(docs_router.router)
app.include_router(feedback_router.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in _ALLOWED_ORIGINS or re.fullmatch(_ALLOWED_ORIGIN_REGEX, origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse({"detail": "Erro interno do servidor."}, status_code=500, headers=headers)


@app.get("/health")
async def health():
    try:
        import chromadb
        client = chromadb.PersistentClient(path="chroma_db")
        client.list_collections()
        chromadb_status = "ok"
    except Exception as e:
        chromadb_status = f"error: {e}"
    return {"status": "ok", "chromadb": chromadb_status}
