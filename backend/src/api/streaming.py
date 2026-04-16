"""
Server-Sent Events streaming endpoint for AI responses.
"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.database import get_user_by_clerk_id, create_user
from src.schemas.schemas import AssistRequest, UserCreate
from src.services.llm_provider import get_user_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_current_db_user(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = get_user_by_clerk_id(db, current_user["clerk_id"])
    if not db_user:
        user_create = UserCreate(
            clerk_id=current_user["clerk_id"],
            email=current_user["email"],
            first_name=current_user.get("first_name"),
            last_name=current_user.get("last_name")
        )
        db_user = create_user(db, user_create)
    return db_user


@router.post("/stream")
async def stream_assist(
    request: AssistRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_db_user)
):
    """Stream AI response token-by-token using Server-Sent Events."""
    chat_model = get_user_chat_model(
        current_user.id, db, streaming=True
    )
    if not chat_model:
        raise HTTPException(
            status_code=400,
            detail="No AI provider available. Add an API key in API Keys settings."
        )

    messages = []
    system_prompt = (
        f"You are an expert coding assistant. The user is working with {request.language or 'code'}. "
        "Provide concise, accurate code suggestions and explanations."
    )
    messages.append(SystemMessage(content=system_prompt))

    if request.file_content:
        messages.append(HumanMessage(
            content=f"Here is the current code context:\n```\n{request.file_content}\n```\n\n{request.prompt or 'Help me with this code.'}"
        ))
    else:
        messages.append(HumanMessage(content=request.prompt or "Help me with code."))

    async def event_generator():
        try:
            async for chunk in chat_model.astream(messages):
                token = chunk.content if hasattr(chunk, "content") else str(chunk)
                if token:
                    yield {
                        "event": "token",
                        "data": json.dumps({"token": token, "done": False})
                    }
            yield {
                "event": "token",
                "data": json.dumps({"token": "", "done": True})
            }
        except Exception as e:
            logger.error("Streaming error: %s", e)
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }

    return EventSourceResponse(event_generator())
