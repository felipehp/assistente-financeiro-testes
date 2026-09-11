import asyncio
import json
import logging
import re
from typing import AsyncGenerator, Optional

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

import auth as auth_module
from persona import build_messages
from providers import call_llm_stream, get_embeddings
from services import config_service
from services import rag_service
from services import rate_limit

router = APIRouter(tags=["chat"])
# auto_error=False so we control the response code (403 instead of 401)
security = HTTPBearer(auto_error=False)

COLD_START_MSG = {
    "message": "Ainda não tenho documentos para consultar. Um administrador precisa adicionar a base de conhecimento primeiro.",
    "avatar_state": "empathetic",
    "movement": "talking",
    "quick_replies": [],
    "sources": [],
}


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token inválido")
    try:
        return auth_module.verify_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token inválido")


def enforce_rate_limit(user: dict = Depends(get_current_user)) -> dict:
    try:
        rate_limit.check_rate_limit(user["sub"])
    except rate_limit.RateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas requisicoes. Tente novamente em instantes.",
            headers={"Retry-After": str(e.retry_after)},
        )
    return user


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


async def _stream(request: ChatRequest) -> AsyncGenerator:
    cfg = config_service.read_config()
    system_prompt = cfg["system_prompt"]

    if rag_service._get_collection_count() == 0:
        yield {"data": json.dumps(COLD_START_MSG)}
        yield {"event": "done", "data": "{}"}
        return

    embeddings = get_embeddings()
    docs = rag_service.retrieve(request.message, embeddings)
    sources = rag_service.extract_sources(docs)
    context = "\n\n".join(d.page_content for d in docs)

    messages = build_messages(system_prompt, request.history, request.message, context)

    heartbeat_task = asyncio.create_task(_heartbeat())
    buffer = ""
    try:
        async for token in call_llm_stream(messages):
            buffer += token

        parsed = _parse_json_response(buffer)
        if docs:
            parsed["sources"] = sources

        yield {"data": json.dumps(parsed, ensure_ascii=False)}
    except Exception as e:
        logger.exception("Erro na chamada ao LLM: %s", e)
        err_str = str(e).lower()
        if "ratelimit" in err_str or "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
            message = "Cota da API do provedor de IA esgotada. Verifique seu plano e limites de uso nas configurações."
        elif "timeout" in err_str or "timed out" in err_str:
            message = "Ops, demorei demais para responder. Tente novamente."
        else:
            message = "Ocorreu um erro ao processar sua mensagem. Tente novamente."
        yield {"data": json.dumps({
            "message": message,
            "avatar_state": "empathetic", "movement": "talking",
            "quick_replies": [], "sources": [],
        })}
    finally:
        heartbeat_task.cancel()
        yield {"event": "done", "data": "{}"}


async def _heartbeat():
    while True:
        await asyncio.sleep(15)


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {
        "message": text[:500] if text else "Não consegui processar a resposta.",
        "avatar_state": "neutral",
        "movement": "talking",
        "quick_replies": [],
        "sources": [],
    }


@router.post("/chat")
async def chat(request: ChatRequest, user: dict = Depends(enforce_rate_limit)):
    return EventSourceResponse(_stream(request))
