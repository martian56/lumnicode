"""
AI Generation Service - orchestrates project generation using LangGraph.
"""
import asyncio
import uuid
import logging
from typing import Dict, Optional

from sqlalchemy.orm import Session

from src.models.models import AIGenerationSession
from src.services.generation_graph import generation_workflow, GenerationState

logger = logging.getLogger(__name__)


class AIGenerationService:
    def __init__(self):
        self.active_tasks: Dict[str, asyncio.Task] = {}

    async def start_generation(
        self,
        project_id: str,
        user_id: int,
        prompt: str,
        tech_stack: list[str],
        db: Session,
        progress_callback=None,
    ) -> str:
        """Start a new AI generation session."""
        session_id = str(uuid.uuid4())

        # Create DB session record
        db_session = AIGenerationSession(
            id=session_id,
            project_id=project_id,
            user_id=user_id,
            status="running",
            progress=0,
            prompt=prompt,
            tech_stack=tech_stack,
        )
        db.add(db_session)
        db.commit()

        # Build initial state
        state: GenerationState = {
            "project_id": project_id,
            "user_id": user_id,
            "session_id": session_id,
            "prompt": prompt,
            "tech_stack": tech_stack,
            "plan": {},
            "config_files": {},
            "app_files": {},
            "files_created": 0,
            "total_files": 0,
            "status": "running",
            "error": None,
            "_progress_callback": progress_callback,
        }

        # Run the graph in a background task
        task = asyncio.create_task(self._run_generation(state, db))
        self.active_tasks[session_id] = task

        return session_id

    async def _run_generation(self, state: GenerationState, db: Session):
        """Execute the LangGraph workflow."""
        session_id = state["session_id"]
        try:
            await generation_workflow.ainvoke(state)
            self._update_db_session(session_id, status="completed", progress=100)

        except asyncio.CancelledError:
            logger.info("Generation %s was cancelled", session_id)
            self._update_db_session(session_id, status="stopped")
        except Exception as e:
            logger.error("Generation %s failed: %s", session_id, e)
            self._update_db_session(
                session_id, status="error", error_message=str(e)
            )
            cb = state.get("_progress_callback")
            if cb and callable(cb):
                await cb(session_id, "error", f"Generation failed: {e}", 0)
        finally:
            self.active_tasks.pop(session_id, None)

    def _update_db_session(
        self, session_id: str, status: str = None,
        progress: int = None, error_message: str = None
    ):
        """Update the generation session in the database."""
        from src.db.database import SessionLocal
        db = SessionLocal()
        try:
            session = db.query(AIGenerationSession).filter(
                AIGenerationSession.id == session_id
            ).first()
            if session:
                if status:
                    session.status = status
                if progress is not None:
                    session.progress = progress
                if error_message:
                    session.error_message = error_message
                db.commit()
        except Exception as e:
            logger.error("Failed to update session %s: %s", session_id, e)
            db.rollback()
        finally:
            db.close()

    async def stop_generation(self, session_id: str):
        """Stop an active generation."""
        task = self.active_tasks.get(session_id)
        if task and not task.done():
            task.cancel()
        self._update_db_session(session_id, status="stopped")

    async def pause_generation(self, session_id: str):
        """Pause an active generation."""
        self._update_db_session(session_id, status="paused")

    async def resume_generation(self, session_id: str):
        """Resume a paused generation."""
        self._update_db_session(session_id, status="running")

    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session status from database."""
        from src.db.database import SessionLocal
        db = SessionLocal()
        try:
            session = db.query(AIGenerationSession).filter(
                AIGenerationSession.id == session_id
            ).first()
            if not session:
                return None
            return {
                "id": str(session.id),
                "project_id": str(session.project_id),
                "user_id": session.user_id,
                "status": session.status,
                "progress": session.progress,
                "prompt": session.prompt,
                "tech_stack": session.tech_stack,
                "error_message": session.error_message,
                "created_at": session.created_at.isoformat() if session.created_at else None,
                "updated_at": session.updated_at.isoformat() if session.updated_at else None,
            }
        finally:
            db.close()


ai_generation_service = AIGenerationService()
