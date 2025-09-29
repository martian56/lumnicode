"""
Health check endpoint.
"""
from fastapi import APIRouter
from src.schemas import HealthResponse
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow()
    )