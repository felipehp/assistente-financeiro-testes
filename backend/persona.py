HISTORY_LIMIT = 10


def build_messages(system_prompt: str, history: list[dict], user_message: str, context: str) -> list[dict]:
    system = system_prompt.replace("[CONTEXTO RECUPERADO DO CHROMADB]", context)
    messages = [{"role": "system", "content": system}]
    for msg in history[-HISTORY_LIMIT:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages
