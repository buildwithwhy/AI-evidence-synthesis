from fastapi import Header, HTTPException
from jose import jwt, JWTError
from app.config import get_settings


async def get_current_user(authorization: str = Header(...)) -> dict:
    """Verify the Supabase JWT from the Authorization header."""
    settings = get_settings()

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]  # Strip "Bearer " prefix

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "email": payload.get("email", "")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
