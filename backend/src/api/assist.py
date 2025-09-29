"""
AI assistance endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from src.services.ai_service import get_ai_service
from src.services.auth import get_current_user
from src.schemas import AssistRequest, AssistResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=AssistResponse)
async def ai_assist(
    request: AssistRequest,
    current_user: dict = Depends(get_current_user)
):
    """AI assistance endpoint."""
    logger.info(f"AI assist request from user {current_user['clerk_id']}")
    logger.info(f"File content length: {len(request.file_content)}")
    logger.info(f"Cursor position: {request.cursor_position}")
    logger.info(f"Prompt: {request.prompt}")

    try:
        ai_service = await get_ai_service()

        # Determine the type of assistance based on the prompt
        # Use provided language if available, otherwise default to javascript
        lang = request.language or 'javascript'
        if request.prompt:
            if "complete" in request.prompt.lower() or "finish" in request.prompt.lower():
                # Code completion
                suggestion = await ai_service.complete_code(
                    prefix=request.file_content,
                    language=lang
                )
            elif "refactor" in request.prompt.lower() or "improve" in request.prompt.lower():
                # Code refactoring
                suggestion = await ai_service.refactor_code(
                    code=request.file_content,
                    language=lang
                )
            elif "explain" in request.prompt.lower() or "what" in request.prompt.lower():
                # Code explanation
                explanation = await ai_service.explain_code(
                    code=request.file_content,
                    language=lang
                )
                suggestion = await ai_service.generate_code_suggestion(
                    code_context=request.file_content,
                    user_prompt=f"Explain this code: {request.prompt}",
                    language=lang
                )
            else:
                # General code suggestion
                suggestion = await ai_service.generate_code_suggestion(
                    code_context=request.file_content,
                    user_prompt=request.prompt,
                    language=lang
                )
        else:
            # Default to code analysis
            suggestions = await ai_service.analyze_code(
                code=request.file_content,
                language=lang,
                cursor_position=request.cursor_position
            )
            if suggestions:
                suggestion = suggestions[0]  # Return the first suggestion
            else:
                suggestion = await ai_service.generate_code_suggestion(
                    code_context=request.file_content,
                    language=lang
                )

        return AssistResponse(
            suggestion=suggestion.code,
            confidence=suggestion.confidence
        )

    except Exception as e:
        logger.error(f"AI service error: {e}")
        return AssistResponse(
            suggestion="// AI assistance temporarily unavailable. Please try again later.",
            confidence=0.0
        )