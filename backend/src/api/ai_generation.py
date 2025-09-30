from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging
from pydantic import BaseModel

from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.database import get_user_by_clerk_id, create_user
from src.models.models import User, Project
from src.services.ai_generation_service import ai_generation_service
from src.api.websocket import get_ai_session, create_ai_session
from src.schemas.schemas import ProjectCreate, ProjectUpdate, UserCreate

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_current_db_user(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user from database, create if doesn't exist."""
    db_user = get_user_by_clerk_id(db, current_user["clerk_id"])
    if not db_user:
        # Create user if they don't exist in our database
        user_create = UserCreate(
            clerk_id=current_user["clerk_id"],
            email=current_user["email"],
            first_name=current_user.get("first_name"),
            last_name=current_user.get("last_name")
        )
        db_user = create_user(db, user_create)
    return db_user

class AIGenerationRequest(BaseModel):
    prompt: str
    tech_stack: List[str]

class AIGenerationResponse(BaseModel):
    session_id: str
    status: str
    message: str

class AISessionResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    status: str
    progress: int
    prompt: str
    tech_stack: List[str]
    context: dict
    created_at: str
    updated_at: str

class AIActionResponse(BaseModel):
    message: str

class AIProvider(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    color: str
    available: bool

class AIProvidersResponse(BaseModel):
    providers: List[AIProvider]

@router.post("/generate/{project_id}", response_model=AIGenerationResponse)
async def start_ai_generation(
    project_id: str,
    request: AIGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_db_user),
    db: Session = Depends(get_db)
):
    """Start AI generation for a project"""
    
    # Verify project exists and user has access
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Start AI generation
        session_id = await ai_generation_service.start_generation(
            project_id=project_id,
            user_id=str(current_user.id),
            prompt=request.prompt,
            tech_stack=request.tech_stack,
            db=db
        )
        
        return AIGenerationResponse(
            session_id=session_id,
            status="started",
            message="AI generation started successfully"
        )
        
    except Exception as e:
        logger.error(f"Error starting AI generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start AI generation: {str(e)}")

@router.get("/session/{session_id}", response_model=AISessionResponse)
async def get_generation_session(
    session_id: str,
    current_user = Depends(get_current_db_user)
):
    """Get AI generation session details"""
    
    session = get_ai_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify user has access to this session
    if session.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return AISessionResponse(**session)

@router.post("/session/{session_id}/stop", response_model=AIActionResponse)
async def stop_generation(
    session_id: str,
    current_user = Depends(get_current_db_user)
):
    """Stop AI generation"""
    
    session = get_ai_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify user has access to this session
    if session.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        await ai_generation_service.stop_generation(session_id)
        return AIActionResponse(message="AI generation stopped successfully")
        
    except Exception as e:
        logger.error(f"Error stopping AI generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop AI generation: {str(e)}")

@router.post("/session/{session_id}/pause", response_model=AIActionResponse)
async def pause_generation(
    session_id: str,
    current_user = Depends(get_current_db_user)
):
    """Pause AI generation"""
    
    session = get_ai_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify user has access to this session
    if session.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        await ai_generation_service.pause_generation(session_id)
        return AIActionResponse(message="AI generation paused successfully")
        
    except Exception as e:
        logger.error(f"Error pausing AI generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to pause AI generation: {str(e)}")

@router.post("/session/{session_id}/resume", response_model=AIActionResponse)
async def resume_generation(
    session_id: str,
    current_user = Depends(get_current_db_user)
):
    """Resume AI generation"""
    
    session = get_ai_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify user has access to this session
    if session.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        await ai_generation_service.resume_generation(session_id)
        return AIActionResponse(message="AI generation resumed successfully")
        
    except Exception as e:
        logger.error(f"Error resuming AI generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to resume AI generation: {str(e)}")

@router.get("/history/{project_id}")
async def get_generation_history(
    project_id: str,
    current_user = Depends(get_current_db_user),
    db: Session = Depends(get_db)
):
    """Get AI generation history for a project"""
    
    # Verify project exists and user has access
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # For now, return empty list - in production you'd store this in database
    return []

@router.get("/providers", response_model=AIProvidersResponse)
async def get_ai_providers():
    """Get list of available AI providers"""
    
    providers = [
        {
            "id": "openai",
            "name": "OpenAI",
            "description": "GPT models for text generation and completion",
            "icon": "🤖",
            "color": "text-green-400",
            "available": True
        },
        {
            "id": "google-gemini",
            "name": "Google Gemini",
            "description": "Google's advanced AI model for code generation",
            "icon": "💎",
            "color": "text-blue-400",
            "available": True
        },
        {
            "id": "anthropic",
            "name": "Anthropic Claude",
            "description": "Claude AI for intelligent code assistance",
            "icon": "🧠",
            "color": "text-purple-400",
            "available": True
        },
        {
            "id": "cohere",
            "name": "Cohere",
            "description": "Cohere AI for natural language processing",
            "icon": "🌊",
            "color": "text-cyan-400",
            "available": True
        },
        {
            "id": "groq",
            "name": "Groq",
            "description": "Fast inference for AI models",
            "icon": "⚡",
            "color": "text-yellow-400",
            "available": True
        }
    ]
    
    return AIProvidersResponse(providers=providers)
