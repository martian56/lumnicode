from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.routing import APIRouter
import json
import asyncio
import uuid
from typing import Dict, List, Optional
from datetime import datetime
import logging

from src.services.auth import get_current_user
from src.models.models import User, Project
from src.db.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, str] = {}  # session_id -> user_id
        self.ai_sessions: Dict[str, Dict] = {}  # session_id -> session_data

    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.user_sessions[session_id] = user_id
        logger.info(f"WebSocket connected for session {session_id}, user {user_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.user_sessions:
            del self.user_sessions[session_id]
        logger.info(f"WebSocket disconnected for session {session_id}")

    async def send_personal_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to {session_id}: {e}")
                self.disconnect(session_id)

    async def broadcast_to_session(self, message: dict, session_id: str):
        await self.send_personal_message(message, session_id)

manager = ConnectionManager()

@router.websocket("/ws/ai-progress/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str, session: Optional[str] = None):
    """WebSocket endpoint for AI generation progress updates"""
    
    # Generate session ID if not provided
    session_id = session or str(uuid.uuid4())
    
    try:
        # For now, we'll accept connections without authentication
        # In production, you'd want to authenticate the user first
        user_id = "anonymous"  # This should be replaced with actual user authentication
        
        await manager.connect(websocket, session_id, user_id)
        
        # Send initial connection confirmation
        await manager.send_personal_message({
            "type": "connected",
            "message": "Connected to AI progress updates",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }, session_id)
        
        # Listen for messages from client
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "stop_ai":
                    await handle_stop_ai(session_id, project_id)
                elif message.get("type") == "pause_ai":
                    await handle_pause_ai(session_id, project_id)
                elif message.get("type") == "resume_ai":
                    await handle_resume_ai(session_id, project_id)
                else:
                    logger.warning(f"Unknown message type: {message.get('type')}")
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Error processing message: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat()
                }, session_id)
                
    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)

async def handle_stop_ai(session_id: str, project_id: str):
    """Handle AI stop request"""
    try:
        # Update AI session status
        if session_id in manager.ai_sessions:
            manager.ai_sessions[session_id]["status"] = "stopped"
            manager.ai_sessions[session_id]["updated_at"] = datetime.utcnow().isoformat()
        
        # Send stop confirmation
        await manager.send_personal_message({
            "type": "stopped",
            "message": "AI generation stopped",
            "progress": 0,
            "timestamp": datetime.utcnow().isoformat()
        }, session_id)
        
        logger.info(f"AI generation stopped for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error stopping AI: {e}")
        await manager.send_personal_message({
            "type": "error",
            "message": f"Failed to stop AI: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }, session_id)

async def handle_pause_ai(session_id: str, project_id: str):
    """Handle AI pause request"""
    try:
        # Update AI session status
        if session_id in manager.ai_sessions:
            manager.ai_sessions[session_id]["status"] = "paused"
            manager.ai_sessions[session_id]["updated_at"] = datetime.utcnow().isoformat()
        
        # Send pause confirmation
        await manager.send_personal_message({
            "type": "paused",
            "message": "AI generation paused",
            "timestamp": datetime.utcnow().isoformat()
        }, session_id)
        
        logger.info(f"AI generation paused for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error pausing AI: {e}")
        await manager.send_personal_message({
            "type": "error",
            "message": f"Failed to pause AI: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }, session_id)

async def handle_resume_ai(session_id: str, project_id: str):
    """Handle AI resume request"""
    try:
        # Update AI session status
        if session_id in manager.ai_sessions:
            manager.ai_sessions[session_id]["status"] = "running"
            manager.ai_sessions[session_id]["updated_at"] = datetime.utcnow().isoformat()
        
        # Send resume confirmation
        await manager.send_personal_message({
            "type": "resumed",
            "message": "AI generation resumed",
            "timestamp": datetime.utcnow().isoformat()
        }, session_id)
        
        logger.info(f"AI generation resumed for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error resuming AI: {e}")
        await manager.send_personal_message({
            "type": "error",
            "message": f"Failed to resume AI: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }, session_id)

# Function to send progress updates (called by AI service)
async def send_progress_update(session_id: str, update_type: str, message: str, progress: int = 0, **kwargs):
    """Send progress update to WebSocket client"""
    if session_id in manager.active_connections:
        await manager.send_personal_message({
            "type": update_type,
            "message": message,
            "progress": progress,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }, session_id)

# Function to create AI session
def create_ai_session(project_id: str, user_id: str, prompt: str, tech_stack: List[str]) -> str:
    """Create a new AI generation session"""
    session_id = str(uuid.uuid4())
    
    manager.ai_sessions[session_id] = {
        "id": session_id,
        "project_id": project_id,
        "user_id": user_id,
        "status": "running",
        "progress": 0,
        "prompt": prompt,
        "tech_stack": tech_stack,
        "context": {},
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    return session_id

# Function to get AI session
def get_ai_session(session_id: str) -> Optional[Dict]:
    """Get AI session data"""
    return manager.ai_sessions.get(session_id)

# Function to update AI session
def update_ai_session(session_id: str, **kwargs):
    """Update AI session data"""
    if session_id in manager.ai_sessions:
        manager.ai_sessions[session_id].update(kwargs)
        manager.ai_sessions[session_id]["updated_at"] = datetime.utcnow().isoformat()

# Export the manager for use in other modules
__all__ = ["router", "manager", "send_progress_update", "create_ai_session", "get_ai_session", "update_ai_session"]
