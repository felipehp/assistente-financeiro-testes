import os
from typing import Any

import litellm
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from services import secret_service
from services.config_service import read_config


def _get_key(name: str) -> str:
    """Look up a secret key in secrets.json first, then fall back to env vars."""
    return secret_service.get_key(name) or os.getenv(name, '')


def get_embeddings() -> Any:
    cfg = read_config()
    provider = cfg.get("embed_provider", "openai")
    model = cfg.get("embed_model", "text-embedding-3-small")
    if provider == "openai":
        key = _get_key('OPENAI_API_KEY')
        if not key:
            raise ValueError("OPENAI_API_KEY não configurada. Adicione-a em Configurações.")
        return OpenAIEmbeddings(model=model, openai_api_key=key)
    if provider == "google":
        key = _get_key('GOOGLE_API_KEY')
        if not key:
            raise ValueError("GOOGLE_API_KEY não configurada. Adicione-a em Configurações.")
        return GoogleGenerativeAIEmbeddings(model=model, google_api_key=key)
    raise ValueError(f"Embed provider não suportado: {provider}")


def mask_key(key: str) -> str:
    if len(key) <= 4:
        return "***"
    return f"***{key[-4:]}"


async def call_llm_stream(messages: list[dict]):
    cfg = read_config()
    provider = cfg.get("llm_provider", "anthropic")
    model = cfg.get("llm_model", "claude-haiku-4-5-20251001")
    temperature = cfg.get("llm_temperature", 0.3)
    max_tokens = cfg.get("llm_max_tokens", None)
    # litellm uses "gemini/" prefix for the Gemini API; "google" maps to VertexAI
    litellm_prefix = "gemini" if provider == "google" else provider
    litellm_model = f"{litellm_prefix}/{model}"
    api_key = _get_key(f'{provider.upper()}_API_KEY')

    kwargs: dict = {
        "model": litellm_model,
        "messages": messages,
        "temperature": temperature,
        "timeout": 30,
        "stream": True,
    }
    if max_tokens:
        kwargs["max_tokens"] = max_tokens
    if api_key:
        kwargs["api_key"] = api_key

    response = await litellm.acompletion(**kwargs)
    async for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
