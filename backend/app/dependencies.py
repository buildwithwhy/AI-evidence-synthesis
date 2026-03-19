import time
import requests
from fastapi import Header, HTTPException
from jwt import PyJWKClient, decode as jwt_decode, InvalidTokenError
from app.config import get_settings

# Cache the JWKS client — keys are cached internally for performance
_jwks_client = None
_jwks_client_ts = 0


def _get_jwks_client() -> PyJWKClient:
    """Get or create the JWKS client, refreshing if older than 5 minutes."""
    global _jwks_client, _jwks_client_ts
    now = time.time()
    if _jwks_client is None or (now - _jwks_client_ts) > 300:
        settings = get_settings()
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        _jwks_client_ts = now
    return _jwks_client


async def get_current_user(authorization: str = Header(...)) -> dict:
    """Verify the Supabase JWT using JWKS (asymmetric key verification)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]  # Strip "Bearer " prefix

    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt_decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "email": payload.get("email", "")}

    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
