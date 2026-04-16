# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lumnicode is an AI-powered online code editor. The backend is FastAPI (Python 3.11+) with PostgreSQL and S3-compatible object storage (MinIO in dev). The frontend is React 19 + TypeScript + Vite. Authentication is handled by Clerk. AI features use LangChain/LangGraph with multi-provider support (OpenAI, Anthropic, Google, Groq, Together, Fireworks).

## Commands

### Backend (run from `backend/`)

Dependencies are managed with **uv** (not pip). The `pyproject.toml` defines dependencies; `uv.lock` pins them.

- **Install deps:** `uv sync` (or `uv sync --dev` for dev tools)
- **Run dev server:** `uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Format:** `uv run black .`
- **Lint:** `uv run ruff check .`
- **Test:** `uv run pytest`
- **Run single test:** `uv run pytest path/to/test.py::test_function_name`
- **Add a dependency:** `uv add <package>`
- **Add a dev dependency:** `uv add --dev <package>`
- **DB migration (create):** `uv run alembic revision --autogenerate -m "description"`
- **DB migration (apply):** `uv run alembic upgrade head`

### Frontend (run from `frontend/`)
- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint` (ESLint)

### Docker
- **Development:** `docker-compose -f docker-compose.dev.yml up` (Postgres + MinIO)
- **Production:** `docker-compose up --build` (full stack with Postgres + MinIO + backend + frontend)

## Architecture

### Backend (`backend/`)
- **Entry point:** `main.py` — FastAPI app, CORS, router registration, S3 health check on startup
- **`src/api/`** — Route handlers: `files.py` (S3-backed CRUD), `assist.py` (AI code assistance via LangChain), `streaming.py` (SSE for streaming AI responses), `ai_generation.py` (project generation), `websocket.py` (real-time progress), `projects.py`, `api_keys.py`, `auth.py`, `health.py`, `debug.py`
- **`src/services/`** — Business logic:
  - `storage_service.py` — S3/MinIO abstraction (put/get/delete objects via boto3)
  - `llm_provider.py` — Unified LangChain ChatModel factory for all AI providers
  - `generation_graph.py` — LangGraph state machine for project generation (plan→config→generate→finalize)
  - `ai_generation_service.py` — Orchestrates LangGraph workflow with DB-persisted sessions
  - `api_key_manager.py` / `api_key_validator.py` — Per-user API key management
- **`src/models/`** — SQLAlchemy models (User, Project, File, UserAPIKey, AIGenerationSession)
- **`src/schemas/`** — Pydantic request/response schemas
- **`src/db/database.py`** — SQLAlchemy engine and session setup
- **`src/config.py`** — Settings from `.env` (DB, S3, Clerk, CORS)

### File Storage
File content is stored in **S3 (MinIO)**, not in the database. The `files` table stores metadata (name, path, language, s3_key, size_bytes). Content is fetched from S3 on read and written to S3 on create/update. The `content` DB column is nullable for backward compatibility with pre-migration data.

### AI Architecture
- **Provider abstraction:** `llm_provider.py` uses LangChain `BaseChatModel` — `ChatOpenAI` for OpenAI/Together/Fireworks/Groq (OpenAI-compatible APIs), `ChatAnthropic` for Anthropic, `ChatGoogleGenerativeAI` for Google
- **Project generation:** `generation_graph.py` is a LangGraph `StateGraph` with 4 nodes: plan → config → generate files → finalize. Sessions are persisted to `ai_generation_sessions` table.
- **Code assistance:** `assist.py` uses the unified provider for code completion, refactoring, analysis, and explanation
- **Streaming:** `streaming.py` provides SSE endpoint (`POST /assist/stream`) for token-by-token responses

### Frontend (`frontend/`)
- React 19 with TypeScript, Tailwind CSS 4, Vite 7
- **Design system:** Zinc color palette with indigo accent. No gradients, no glass-morphism.
- **Code editor:** Monaco Editor with AI panel (Suggestions/Chat/Issues/Metrics tabs)
- **Command Palette:** `Cmd+K` opens AI command palette with streaming responses
- **SSE streaming:** `src/lib/streaming.ts` consumes token-by-token AI responses
- **Auth:** Clerk (`@clerk/clerk-react`)
- **HTTP client:** Axios (`src/lib/api.ts`)
- **Routing:** React Router v7

## Git Workflow

- **Main branch:** `main`
- **Development branch:** `develop`
- **Branch naming:** `feature/feature_name`, `hotfix/fix_name`, `release/release_version`

## Code Style

- **Python:** Black (line-length 88), Ruff. PEP 8.
- **TypeScript/React:** ESLint + Prettier. Prefer typed over `any`.

## Environment Variables

Backend requires: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`. User AI keys are stored per-user in the database.

Frontend requires: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.
