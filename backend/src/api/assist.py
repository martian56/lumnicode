"""
AI assistance endpoint with multi-provider support.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.multi_provider_ai_service import get_multi_provider_ai_service, MultiProviderAIService
from src.services.api_key_manager import APIKeyManager
from src.services.database import get_user_by_clerk_id
from src.schemas import AssistRequest, AssistResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=AssistResponse)
async def ai_assist(
    request: AssistRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI assistance endpoint with multi-provider support."""
    logger.info(f"AI assist request from user {current_user['clerk_id']}")
    logger.info(f"File content length: {len(request.file_content)}")
    logger.info(f"Cursor position: {request.cursor_position}")
    logger.info(f"Prompt: {request.prompt}")

    try:
        # Get user from database
        user = get_user_by_clerk_id(db, current_user["clerk_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize AI service with API key manager
        ai_service = await get_multi_provider_ai_service()
        api_key_manager = APIKeyManager(db)
        ai_service.set_api_key_manager(api_key_manager)
        
        # Determine the type of assistance based on the prompt
        lang = request.language or 'javascript'
        
        if request.prompt:
            if "complete" in request.prompt.lower() or "finish" in request.prompt.lower():
                # Code completion
                suggestion = await ai_service.complete_code(
                    user_id=user.id,
                    prefix=request.file_content,
                    language=lang
                )
            elif "refactor" in request.prompt.lower() or "improve" in request.prompt.lower():
                # Code refactoring
                suggestion = await ai_service.refactor_code(
                    user_id=user.id,
                    code=request.file_content,
                    language=lang
                )
            elif "explain" in request.prompt.lower() or "what" in request.prompt.lower():
                # Code explanation
                explanation = await ai_service.explain_code(
                    user_id=user.id,
                    code=request.file_content,
                    language=lang
                )
                suggestion = await ai_service.generate_code_suggestion(
                    user_id=user.id,
                    code_context=request.file_content,
                    user_prompt=f"Explain this code: {request.prompt}",
                    language=lang
                )
            else:
                # General code suggestion
                suggestion = await ai_service.generate_code_suggestion(
                    user_id=user.id,
                    code_context=request.file_content,
                    user_prompt=request.prompt,
                    language=lang
                )
        else:
            # Default to code analysis
            suggestions = await ai_service.analyze_code(
                user_id=user.id,
                code=request.file_content,
                language=lang,
                cursor_position=request.cursor_position
            )
            if suggestions:
                suggestion = suggestions[0]  # Return the first suggestion
            else:
                suggestion = await ai_service.generate_code_suggestion(
                    user_id=user.id,
                    code_context=request.file_content,
                    language=lang
                )

        return AssistResponse(
            suggestion=suggestion.code,
            confidence=suggestion.confidence
        )

    except ValueError as e:
        # No API keys available
        logger.warning(f"No API keys available for user {current_user['clerk_id']}: {e}")
        return AssistResponse(
            suggestion="// No API keys configured. Please add your AI provider API keys in the API Key Manager to use AI assistance.",
            confidence=0.0
        )
    except Exception as e:
        logger.error(f"AI service error: {e}")
        return AssistResponse(
            suggestion="// AI assistance temporarily unavailable. Please try again later.",
            confidence=0.0
        )