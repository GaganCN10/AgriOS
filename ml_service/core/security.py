from fastapi import Header, HTTPException
from core.config import settings


async def verify_internal_token(x_internal_token: str = Header(...)):
    if x_internal_token != settings.INTERNAL_SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid internal token.")
