"""
API Key Management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.api_key_manager import APIKeyManager
from src.models.models import ProviderEnum
from src.schemas.schemas import User

router = APIRouter()


# Request/Response models
class APIKeyCreate(BaseModel):
    provider: str
    api_key: str
    display_name: Optional[str] = None


class APIKeyResponse(BaseModel):
    id: str
    provider: str
    display_name: str
    is_active: bool
    is_validated: bool
    last_validated_at: Optional[str] = None
    last_used_at: Optional[str] = None
    usage_count: int
    monthly_limit: Optional[int] = None
    current_month_usage: int
    rate_limit_per_minute: int
    created_at: str
    quota_info: Optional[Dict[str, Any]] = None


class APIKeyCreateResponse(BaseModel):
    success: bool
    message: str
    key_id: Optional[str] = None
    error: Optional[str] = None
    quota_info: Optional[Dict[str, Any]] = None


class UsageStatsResponse(BaseModel):
    total_keys: int
    active_keys: int
    total_usage: int
    providers: List[str]
    keys: List[Dict[str, Any]]


@router.post("/", response_model=APIKeyCreateResponse)
async def add_api_key(
    request: APIKeyCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new API key for the current user."""
    try:
        # Validate provider
        try:
            provider = ProviderEnum(request.provider.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid provider. Supported providers: {[p.value for p in ProviderEnum]}"
            )
        
        # Get user ID from database
        from src.services.database import get_user_by_clerk_id
        user = get_user_by_clerk_id(db, current_user["clerk_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Add API key
        manager = APIKeyManager(db)
        result = await manager.add_api_key(
            user_id=user.id,
            provider=provider,
            api_key=request.api_key,
            display_name=request.display_name
        )
        
        if result["success"]:
            return APIKeyCreateResponse(
                success=True,
                message=result["message"],
                key_id=result["key_id"],
                quota_info=result.get("quota_info")
            )
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/", response_model=List[APIKeyResponse])
async def get_api_keys(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all API keys for the current user."""
    try:
        # Get user ID from database
        from src.services.database import get_user_by_clerk_id
        user = get_user_by_clerk_id(db, current_user["clerk_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        manager = APIKeyManager(db)
        keys = manager.get_user_api_keys(user.id)
        
        return [APIKeyResponse(**key) for key in keys]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/providers")
async def get_providers():
    """Get list of supported AI providers."""
    providers = [
        {
            "id": "openai",
            "name": "OpenAI",
            "description": "GPT models for text generation and completion",
            "icon": "🤖",
            "color": "text-green-400"
        },
        {
            "id": "google",
            "name": "Google Gemini",
            "description": "Google's advanced AI models",
            "icon": "💎",
            "color": "text-blue-400"
        },
        {
            "id": "anthropic",
            "name": "Anthropic Claude",
            "description": "Claude AI for safe and helpful assistance",
            "icon": "🧠",
            "color": "text-purple-400"
        },
        {
            "id": "huggingface",
            "name": "Hugging Face",
            "description": "Open source AI models and transformers",
            "icon": "🤗",
            "color": "text-yellow-400"
        },
        {
            "id": "together",
            "name": "Together AI",
            "description": "Open source AI models platform",
            "icon": "🔗",
            "color": "text-orange-400"
        },
        {
            "id": "fireworks",
            "name": "Fireworks AI",
            "description": "Fast inference for open source models",
            "icon": "🎆",
            "color": "text-red-400"
        },
        {
            "id": "cohere",
            "name": "Cohere",
            "description": "Language AI for text understanding and generation",
            "icon": "🌊",
            "color": "text-cyan-400"
        },
        {
            "id": "groq",
            "name": "Groq",
            "description": "Ultra-fast AI inference",
            "icon": "⚡",
            "color": "text-indigo-400"
        }
    ]
    
    return {"providers": providers}


@router.get("/usage", response_model=UsageStatsResponse)
async def get_usage_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage statistics for the current user."""
    try:
        # Get user ID from database
        from src.services.database import get_user_by_clerk_id
        user = get_user_by_clerk_id(db, current_user["clerk_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        manager = APIKeyManager(db)
        stats = manager.get_usage_stats(user.id)
        
        return UsageStatsResponse(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/validate")
async def validate_all_keys(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate all API keys for the current user."""
    try:
        # Get user ID from database
        from src.services.database import get_user_by_clerk_id
        user = get_user_by_clerk_id(db, current_user["clerk_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        manager = APIKeyManager(db)
        results = await manager.validate_all_keys(user.id)
        
        return {"success": True, "results": results}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/{key_id}/deactivate")
async def deactivate_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate an API key."""
    try:
        # Get user ID from database
        from src.services.database import get_user_by_clerk_id
        user = get_user_by_clerk_id(db, current_user["clerk_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        manager = APIKeyManager(db)
        success = manager.deactivate_key(key_id, user.id)
        
        if success:
            return {"success": True, "message": "API key deactivated successfully"}
        else:
            raise HTTPException(status_code=404, detail="API key not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{key_id}")
async def delete_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an API key."""
    try:
        # Get user ID from database
        from src.services.database import get_user_by_clerk_id
        user = get_user_by_clerk_id(db, current_user["clerk_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        manager = APIKeyManager(db)
        success = manager.delete_key(key_id, user.id)
        
        if success:
            return {"success": True, "message": "API key deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="API key not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/providers")
async def get_supported_providers():
    """Get list of supported AI providers."""
    return {
        "providers": [
            {
                "id": provider.value,
                "name": provider.value.title(),
                "description": f"{provider.value.title()} AI API"
            }
            for provider in ProviderEnum
        ]
    }
