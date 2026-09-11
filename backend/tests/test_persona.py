def test_build_prompt_injects_context():
    from persona import build_messages
    system = "Você é OWL.\n\n[CONTEXTO RECUPERADO DO CHROMADB]"
    history = [{"role": "user", "content": "Oi"}, {"role": "assistant", "content": "Olá!"}]
    context = "Art. 1. O prazo é 30 dias."
    msgs = build_messages(system, history, "Qual o prazo?", context)
    system_content = msgs[0]["content"]
    assert "Art. 1. O prazo é 30 dias." in system_content
    assert "[CONTEXTO RECUPERADO DO CHROMADB]" not in system_content

def test_build_prompt_limits_history():
    from persona import build_messages
    system = "Você é OWL.\n[CONTEXTO RECUPERADO DO CHROMADB]"
    history = [{"role": "user" if i % 2 == 0 else "assistant", "content": f"msg{i}"} for i in range(30)]
    msgs = build_messages(system, history, "nova", "ctx")
    # system + últimas 10 + user atual = 12
    assert len(msgs) == 12

def test_mask_api_key():
    from providers import mask_key
    assert mask_key("sk-ant-abcdefghij1234") == "***1234"
    assert mask_key("ab") == "***"
    assert mask_key("") == "***"
