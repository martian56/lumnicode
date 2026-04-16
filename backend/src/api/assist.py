"""
AI assistance endpoint using unified LLM provider.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage, SystemMessage

from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.database import get_user_by_clerk_id, create_user
from src.schemas.schemas import AssistRequest, AssistResponse, UserCreate
from src.services.llm_provider import get_user_chat_model

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


@router.post("/", response_model=AssistResponse)
async def ai_assist(
    request: AssistRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_db_user)
):
    """AI assistance endpoint using user's configured API keys."""
    try:
        chat_model = get_user_chat_model(current_user.id, db)
        if not chat_model:
            return AssistResponse(
                suggestion="No AI provider configured. Add an API key in API Keys settings.",
                confidence=0.0
            )

        lang = request.language or "javascript"
        system_prompt = (
            f"You are an expert coding assistant specializing in {lang}. "
            "Provide concise, accurate code suggestions. "
            "When asked to complete, refactor, or explain code, respond with the code or explanation directly. "
            "Do not wrap code in markdown code blocks unless specifically asked."
        )

        user_content = ""
        if request.file_content:
            user_content = f"Code context:\n```{lang}\n{request.file_content}\n```\n\n"
        if request.prompt:
            user_content += request.prompt
        else:
            user_content += "Analyze this code and suggest improvements."

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_content),
        ]

        response = await chat_model.ainvoke(messages)
        suggestion_text = response.content if hasattr(response, "content") else str(response)

        return AssistResponse(
            suggestion=suggestion_text,
            confidence=0.85
        )

    except Exception as e:
        logger.error("AI assist error: %s", e)
        return AssistResponse(
            suggestion="// AI assistance temporarily unavailable. Please try again later.",
            confidence=0.0
        )
