"""
LangGraph-based AI project generation workflow.
Replaces the linear AIGenerationService with a state machine graph.
"""
import json
import logging
from typing import TypedDict, Optional
from datetime import datetime

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from src.services.llm_provider import get_user_chat_model
from src.services.storage_service import storage_service
from src.models.models import File as FileModel, Project
from src.db.database import SessionLocal

logger = logging.getLogger(__name__)


class GenerationState(TypedDict, total=False):
    """State passed between graph nodes."""
    project_id: str
    user_id: int
    session_id: str
    prompt: str
    tech_stack: list[str]
    plan: dict  # {files: [{path, type, description}], dependencies: [...]}
    config_files: dict[str, str]  # path -> content
    app_files: dict[str, str]  # path -> content
    files_created: int
    total_files: int
    status: str
    error: Optional[str]
    # Callback for progress updates (set at runtime, not serialized)
    _progress_callback: Optional[object]


async def _send_progress(state: GenerationState, msg_type: str, message: str, progress: int, **kwargs):
    """Send progress update via the callback if available."""
    cb = state.get("_progress_callback")
    if cb and callable(cb):
        await cb(state["session_id"], msg_type, message, progress, **kwargs)


async def _call_llm(state: GenerationState, prompt: str, system: str = "", max_tokens: int = 2000) -> str:
    """Call the user's LLM provider."""
    db = SessionLocal()
    try:
        chat_model = get_user_chat_model(state["user_id"], db)
        if not chat_model:
            raise RuntimeError("No AI provider available. Add an API key in Settings > API Keys.")

        messages = []
        if system:
            messages.append(SystemMessage(content=system))
        messages.append(HumanMessage(content=prompt))

        response = await chat_model.ainvoke(messages)
        return response.content
    finally:
        db.close()


def _parse_json_safe(text: str) -> Optional[dict]:
    """Try to parse JSON from text, handling markdown code blocks."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # skip ```json
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def _create_file_in_s3(project_id: str, file_path: str, content: str, language: str, session_id: str):
    """Create a file record in DB and store content in S3."""
    s3_key = storage_service._make_key(project_id, file_path)
    await storage_service.put_object(s3_key, content)

    db = SessionLocal()
    try:
        name = file_path.rsplit("/", 1)[-1] if "/" in file_path else file_path
        db_file = FileModel(
            name=name,
            path=file_path,
            content=None,
            language=language,
            project_id=project_id,
            s3_key=s3_key,
            size_bytes=len(content.encode("utf-8")),
        )
        db.add(db_file)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Failed to create file %s: %s", file_path, e)
    finally:
        db.close()


def _language_from_path(path: str) -> str:
    ext_map = {
        "js": "javascript", "jsx": "javascript", "ts": "typescript", "tsx": "typescript",
        "py": "python", "html": "html", "css": "css", "json": "json", "md": "markdown",
        "yaml": "yaml", "yml": "yaml", "toml": "toml", "sql": "sql",
        "java": "java", "go": "go", "rs": "rust", "rb": "ruby", "php": "php",
    }
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return ext_map.get(ext, "text")


# ─── Graph Nodes ───────────────────────────────────────────────────


async def plan_node(state: GenerationState) -> GenerationState:
    """Analyze requirements and produce a file plan."""
    await _send_progress(state, "progress", "Planning project structure...", 5)

    tech_str = ", ".join(state["tech_stack"]) if state.get("tech_stack") else "web technologies"
    prompt = f"""You are a senior software architect. Plan a project based on this description:

"{state['prompt']}"

Tech stack: {tech_str}

Return a JSON object with:
{{
  "files": [
    {{"path": "src/App.tsx", "type": "component", "description": "Main application component"}}
  ],
  "dependencies": {{"react": "^18.0.0"}},
  "description": "Brief project description"
}}

Include 5-15 files that form a complete, working project. Include config files (package.json, tsconfig.json, etc).
Return ONLY valid JSON, no markdown."""

    response = await _call_llm(state, prompt, system="You are a project architect. Respond with valid JSON only.")
    plan = _parse_json_safe(response)

    if not plan or "files" not in plan:
        plan = {
            "files": [
                {"path": "package.json", "type": "config", "description": "Package manifest"},
                {"path": "src/index.ts", "type": "entry", "description": "Entry point"},
                {"path": "src/App.tsx", "type": "component", "description": "Main component"},
                {"path": "README.md", "type": "docs", "description": "Project documentation"},
            ],
            "dependencies": {},
            "description": state["prompt"],
        }

    state["plan"] = plan
    state["total_files"] = len(plan.get("files", []))
    state["files_created"] = 0
    state["status"] = "planning"

    await _send_progress(state, "progress", f"Planned {state['total_files']} files", 15)
    return state


async def config_node(state: GenerationState) -> GenerationState:
    """Generate configuration files (package.json, tsconfig, etc)."""
    await _send_progress(state, "progress", "Generating configuration...", 20)
    state["status"] = "configuring"

    plan = state.get("plan", {})
    config_files = [f for f in plan.get("files", []) if f.get("type") == "config" or f["path"].endswith((".json", ".toml", ".yaml", ".yml"))]

    tech_str = ", ".join(state.get("tech_stack", []))
    deps = json.dumps(plan.get("dependencies", {}))

    for cf in config_files:
        prompt = f"""Generate the content for {cf['path']} for a project using {tech_str}.
Description: {cf.get('description', '')}
Dependencies to include: {deps}
Project description: {state['prompt']}

Return ONLY the file content, no markdown code blocks, no explanation."""

        try:
            content = await _call_llm(state, prompt, max_tokens=1000)
            # Strip markdown if LLM wrapped it
            if content.startswith("```"):
                lines = content.split("\n")[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                content = "\n".join(lines)

            await _create_file_in_s3(
                state["project_id"], cf["path"], content,
                _language_from_path(cf["path"]), state["session_id"]
            )
            state["files_created"] = state.get("files_created", 0) + 1

            await _send_progress(
                state, "file_created", f"Created {cf['path']}",
                20 + int((state["files_created"] / state["total_files"]) * 10),
                current_file=cf["path"],
                total_files=state["total_files"],
                completed_files=state["files_created"],
            )
        except Exception as e:
            logger.error("Failed to generate %s: %s", cf["path"], e)

    state["config_files"] = {cf["path"]: "" for cf in config_files}
    return state


async def generate_files_node(state: GenerationState) -> GenerationState:
    """Generate application source files."""
    await _send_progress(state, "progress", "Generating source files...", 30)
    state["status"] = "generating"

    plan = state.get("plan", {})
    source_files = [
        f for f in plan.get("files", [])
        if f["path"] not in state.get("config_files", {})
    ]

    tech_str = ", ".join(state.get("tech_stack", []))

    for sf in source_files:
        prompt = f"""Generate the content for {sf['path']}.
Project: {state['prompt']}
Tech stack: {tech_str}
File type: {sf.get('type', 'source')}
Description: {sf.get('description', '')}

The project structure includes these files: {', '.join(f['path'] for f in plan.get('files', []))}

Generate clean, production-quality code. Return ONLY the file content, no markdown code blocks."""

        try:
            content = await _call_llm(state, prompt, max_tokens=2000)
            if content.startswith("```"):
                lines = content.split("\n")[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                content = "\n".join(lines)

            await _create_file_in_s3(
                state["project_id"], sf["path"], content,
                _language_from_path(sf["path"]), state["session_id"]
            )
            state["files_created"] = state.get("files_created", 0) + 1

            progress = 30 + int((state["files_created"] / state["total_files"]) * 60)
            await _send_progress(
                state, "file_created", f"Created {sf['path']}", progress,
                current_file=sf["path"],
                total_files=state["total_files"],
                completed_files=state["files_created"],
            )
        except Exception as e:
            logger.error("Failed to generate %s: %s", sf["path"], e)

    return state


async def finalize_node(state: GenerationState) -> GenerationState:
    """Finalize the project."""
    await _send_progress(state, "progress", "Finalizing project...", 95)

    # Update project description
    db = SessionLocal()
    try:
        plan = state.get("plan", {})
        description = plan.get("description", state.get("prompt", ""))
        project = db.query(Project).filter(Project.id == state["project_id"]).first()
        if project and not project.description:
            project.description = description
            db.commit()
    except Exception as e:
        logger.error("Failed to update project: %s", e)
        db.rollback()
    finally:
        db.close()

    state["status"] = "completed"
    await _send_progress(
        state, "completed", "Project generation completed!", 100,
        total_files=state.get("total_files", 0),
        completed_files=state.get("files_created", 0),
    )
    return state


# ─── Graph Construction ────────────────────────────────────────────


def build_generation_workflow():
    """Build and compile the LangGraph generation workflow."""
    graph = StateGraph(GenerationState)

    graph.add_node("plan", plan_node)
    graph.add_node("config", config_node)
    graph.add_node("generate", generate_files_node)
    graph.add_node("finalize", finalize_node)

    graph.add_edge("plan", "config")
    graph.add_edge("config", "generate")
    graph.add_edge("generate", "finalize")
    graph.add_edge("finalize", END)

    graph.set_entry_point("plan")

    return graph.compile()


generation_workflow = build_generation_workflow()
