import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def _make_chunk(content: str | None):
    chunk = MagicMock()
    chunk.choices = [MagicMock()]
    chunk.choices[0].delta = MagicMock()
    chunk.choices[0].delta.content = content
    return chunk


@pytest.mark.asyncio
async def test_call_llm_stream_passes_temperature_from_config():
    cfg = {
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        "llm_temperature": 0.1,
    }

    async def _fake_stream():
        yield _make_chunk("ok")

    mock_acomp = AsyncMock(return_value=_fake_stream())

    with patch("providers.read_config", return_value=cfg), \
         patch("providers._get_key", return_value=""), \
         patch("litellm.acompletion", mock_acomp):
        from providers import call_llm_stream
        tokens = [t async for t in call_llm_stream([{"role": "user", "content": "x"}])]

    assert tokens == ["ok"]
    called_kwargs = mock_acomp.call_args.kwargs
    assert called_kwargs["temperature"] == pytest.approx(0.1)


@pytest.mark.asyncio
async def test_call_llm_stream_passes_max_tokens_from_config():
    cfg = {
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        "llm_temperature": 0.3,
        "llm_max_tokens": 512,
    }

    async def _fake_stream():
        yield _make_chunk("hello")

    mock_acomp = AsyncMock(return_value=_fake_stream())

    with patch("providers.read_config", return_value=cfg), \
         patch("providers._get_key", return_value=""), \
         patch("litellm.acompletion", mock_acomp):
        from providers import call_llm_stream
        [t async for t in call_llm_stream([{"role": "user", "content": "x"}])]

    called_kwargs = mock_acomp.call_args.kwargs
    assert called_kwargs["max_tokens"] == 512


@pytest.mark.asyncio
async def test_call_llm_stream_omits_max_tokens_when_not_in_config():
    cfg = {
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        "llm_temperature": 0.3,
        # sem llm_max_tokens
    }

    async def _fake_stream():
        yield _make_chunk(None)

    mock_acomp = AsyncMock(return_value=_fake_stream())

    with patch("providers.read_config", return_value=cfg), \
         patch("providers._get_key", return_value=""), \
         patch("litellm.acompletion", mock_acomp):
        from providers import call_llm_stream
        [t async for t in call_llm_stream([{"role": "user", "content": "x"}])]

    called_kwargs = mock_acomp.call_args.kwargs
    assert "max_tokens" not in called_kwargs


@pytest.mark.asyncio
async def test_call_llm_stream_uses_default_temperature_when_not_in_config():
    cfg = {
        "llm_provider": "openai",
        "llm_model": "gpt-4o-mini",
        # sem llm_temperature
    }

    async def _fake_stream():
        yield _make_chunk(None)

    mock_acomp = AsyncMock(return_value=_fake_stream())

    with patch("providers.read_config", return_value=cfg), \
         patch("providers._get_key", return_value=""), \
         patch("litellm.acompletion", mock_acomp):
        from providers import call_llm_stream
        [t async for t in call_llm_stream([{"role": "user", "content": "x"}])]

    called_kwargs = mock_acomp.call_args.kwargs
    assert called_kwargs["temperature"] == pytest.approx(0.3)
