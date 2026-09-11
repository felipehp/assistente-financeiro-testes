import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import auth as auth_module

router = APIRouter(prefix="/feedback", tags=["feedback"])
security = HTTPBearer(auto_error=False)
FEEDBACK_PATH = Path(__file__).parent.parent / "feedback.jsonl"


def _get_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token ausente")
    try:
        return auth_module.verify_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token inválido")


def _require_staff(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token ausente")
    try:
        user = auth_module.verify_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token inválido")
    if user["role"] not in ("professor", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão")
    return user


@router.post("")
async def post_feedback(body: dict, user: dict = Depends(_get_user)):
    ts = datetime.now(timezone.utc).isoformat()
    session_id = hashlib.sha256(ts.encode()).hexdigest()[:16]
    record = {"session_id": session_id, "role": user["role"], "timestamp": ts, **body}
    with FEEDBACK_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return {"status": "recorded"}


@router.get("")
async def get_feedback(user: dict = Depends(_require_staff)):
    if not FEEDBACK_PATH.exists():
        return {"sessions": [], "negative_messages": [], "rag_gaps": []}

    sessions: list[dict] = []
    negative: list[dict] = []
    gap_counts: dict[str, int] = {}

    for line in FEEDBACK_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        if r.get("type") == "session":
            sessions.append({"emoji": r["emoji"], "message_count": r["message_count"], "timestamp": r["timestamp"]})
        elif r.get("type") == "message":
            if r.get("rating") == "down":
                negative.append({"question": r["question"], "answer": r["answer"], "sources": r["sources"], "timestamp": r["timestamp"]})
            if r.get("sources") == ["Sem identificação da fonte"]:
                gap_counts[r["question"]] = gap_counts.get(r["question"], 0) + 1

    rag_gaps = [{"question": q, "count": c} for q, c in sorted(gap_counts.items(), key=lambda x: -x[1])]
    return {"sessions": sessions, "negative_messages": negative, "rag_gaps": rag_gaps}


@router.get("/export")
async def export_csv(user: dict = Depends(_require_staff)):
    if not FEEDBACK_PATH.exists():
        return StreamingResponse(iter([""]), media_type="text/csv")
    lines = FEEDBACK_PATH.read_text(encoding="utf-8").splitlines()
    records = [json.loads(l) for l in lines if l.strip()]

    header = "type,session_id,role,rating,emoji,question,answer,sources,timestamp\n"
    rows = []
    for r in records:
        rows.append(",".join([
            r.get("type", ""),
            r.get("session_id", ""),
            r.get("role", ""),
            r.get("rating", ""),
            r.get("emoji", ""),
            f'"{r.get("question", "")}"',
            f'"{r.get("answer", "")}"',
            ";".join(r.get("sources", [])),
            r.get("timestamp", ""),
        ]))
    content = header + "\n".join(rows)
    return StreamingResponse(iter([content]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=feedback.csv"})
