from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import auth as auth_module

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(req: LoginRequest):
    user = auth_module.authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    token = auth_module.create_token(user["username"], user["role"])
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}
