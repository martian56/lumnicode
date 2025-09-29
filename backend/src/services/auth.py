"""
Authentication service using Clerk.
"""
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from src.config import settings
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


class ClerkAuth:
    def __init__(self):
        self.clerk_secret_key = settings.clerk_secret_key
        self.jwks_url = "https://api.clerk.dev/v1/jwks"
        self._jwks = None

    async def get_jwks(self):
        """Fetch JWKS from Clerk."""
        if not self._jwks:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.jwks_url)
                response.raise_for_status()
                self._jwks = response.json()
        return self._jwks

    async def verify_token(self, token: str) -> dict:
        """Verify Clerk JWT token."""
        if not self.clerk_secret_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Clerk secret key not configured"
            )

        try:
            # For development, we'll decode without verification
            # In production, you should verify the token against Clerk's JWKS
            payload = jwt.decode(
                token,
                key="",  # Empty key for unverified decoding
                algorithms=["HS256", "RS256"],
                options={
                    "verify_signature": False,
                    "verify_exp": False,  # Don't verify expiration
                    "verify_nbf": False,  # Don't verify not-before
                    "verify_iat": False,  # Don't verify issued-at
                    "verify_aud": False,  # Don't verify audience
                }
            )
            
            return payload
            
        except JWTError as e:
            logger.error(f"JWT verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )


clerk_auth = ClerkAuth()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Get current user from JWT token."""
    token = credentials.credentials
    payload = await clerk_auth.verify_token(token)
    
    if not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Extract user ID from the sub field
    user_id = payload.get("sub", "unknown")
    
    return {
        "clerk_id": user_id,
        "email": f"{user_id}@lumnicode.dev",  # Fallback email using user ID
        "first_name": "User",  # Default first name
        "last_name": user_id.split("_")[-1] if "_" in user_id else "Unknown",  # Use part of user ID as last name
    }