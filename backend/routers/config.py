import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

import auth as auth_module
from providers import mask_key
from services import config_service, secret_service

router = APIRouter(prefix="/config", tags=["config"])
security = HTTPBearer(auto_error=False)


def _require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token ausente")
    try:
        user = auth_module.verify_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token inválido")
    if user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requer perfil admin")
    return user


class ConfigUpdate(BaseModel):
    system_prompt: str
    llm_provider: str
    llm_model: str
    llm_temperature: float | None = Field(None, ge=0.0, le=1.0)
    llm_max_tokens: int | None = Field(None, ge=256, le=4096)
    embed_provider: str
    embed_model: str
    rag_retrieval_k: int | None = Field(None, ge=1, le=20)
    rag_chunk_size: int | None = Field(None, ge=200, le=2000)
    rag_score_threshold: float | None = Field(None, ge=0.0, le=1.0)
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    google_api_key: str | None = None


@router.get("")
async def get_config(user: dict = Depends(_require_admin)):
    cfg = config_service.read_config()
    return {
        **cfg,
        "anthropic_api_key": mask_key(secret_service.get_key("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "")),
        "openai_api_key": mask_key(secret_service.get_key("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY", "")),
        "google_api_key": mask_key(secret_service.get_key("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY", "")),
    }


@router.put("")
async def put_config(body: ConfigUpdate, user: dict = Depends(_require_admin)):
    cfg = config_service.read_config()
    cfg.update(body.model_dump(
        exclude={"anthropic_api_key", "openai_api_key", "google_api_key"},
        exclude_none=True,
    ))
    config_service.write_config(cfg)
    secret_service.set_keys({
        "ANTHROPIC_API_KEY": body.anthropic_api_key or "",
        "OPENAI_API_KEY": body.openai_api_key or "",
        "GOOGLE_API_KEY": body.google_api_key or "",
    })
    return {"status": "saved"}
