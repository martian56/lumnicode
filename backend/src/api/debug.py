"""
Debug endpoints for development.
"""
from fastapi import APIRouter, Depends
from src.services.auth import get_current_user

router = APIRouter()

@router.get("/token")
async def debug_token(current_user: dict = Depends(get_current_user)):
    """Debug endpoint to see what's in the JWT token."""
    return {
        "message": "Token successfully decoded",
        "user_data": current_user
    }