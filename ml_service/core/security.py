from fastapi import Header, HTTPException, status
from ml_service.core.config import settings

async def verify_internal_token(x_internal_token: str = Header(None, alias="X-Internal-Token")):
    # Enforce token validation
    if not x_internal_token or x_internal_token != settings.INTERNAL_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized. Missing or invalid internal machine token."
        )
