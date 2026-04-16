# Contributing to Lumnicode

Thank you for your interest in contributing to Lumnicode! This guide will help you get started.

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Postgres + MinIO)
- [Node.js](https://nodejs.org/) v20+
- [Python](https://www.python.org/) 3.11+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- A [Clerk](https://clerk.com/) account (free tier works)

### Development Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/lumnicode.git
   cd lumnicode
   ```

2. **Start infrastructure** (Postgres + MinIO):
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Set up the backend:**
   ```bash
   cd backend
   cp .env.example .env   # Edit with your Clerk keys
   uv sync
   uv run alembic upgrade head
   uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Set up the frontend:**
   ```bash
   cd frontend
   cp .env.example .env   # Edit with your Clerk publishable key
   npm install
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser.

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `hotfix/description` - Bug fixes
- `release/version` - Release branches

### Making Changes

1. Create a branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. Make your changes.

3. Run checks before committing:
   ```bash
   # Backend
   cd backend
   uv run black .
   uv run ruff check .
   uv run pytest

   # Frontend
   cd frontend
   npm run lint
   npm run build
   ```

4. Commit with a descriptive message:
   ```bash
   git commit -m "Add user avatar upload to settings page"
   ```

5. Push and open a Pull Request against `develop`.

## Code Style

### Python (Backend)

- Formatter: [Black](https://black.readthedocs.io/) (line length 88)
- Linter: [Ruff](https://docs.astral.sh/ruff/)
- Follow PEP 8 conventions
- Use type hints for function parameters and return values
- Use `logging` module, not `print()`

### TypeScript (Frontend)

- Linter: ESLint
- Formatter: Prettier
- Prefer explicit types over `any`
- Use functional components with hooks
- Follow the existing zinc/indigo design system (no gradients, no glass-morphism)

## Project Structure

```
lumnicode/
├── backend/
│   ├── src/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Business logic
│   │   │   ├── storage_service.py    # S3/MinIO file storage
│   │   │   ├── llm_provider.py       # LangChain AI provider factory
│   │   │   ├── generation_graph.py   # LangGraph project generation
│   │   │   └── ai_generation_service.py
│   │   └── db/           # Database configuration
│   ├── alembic/          # Database migrations
│   └── main.py           # FastAPI entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # API client, streaming, WebSocket
│   └── package.json
└── docker-compose.dev.yml
```

## Adding a New AI Provider

1. Add the provider enum value in `backend/src/models/models.py` (`ProviderEnum`)
2. Add default model mapping in `backend/src/services/llm_provider.py` (`DEFAULT_MODELS`)
3. If OpenAI-compatible, add the base URL to `OPENAI_COMPATIBLE_URLS`
4. If not OpenAI-compatible, add a new LangChain ChatModel case in `get_chat_model()`
5. Add validation logic in `backend/src/services/api_key_validator.py`
6. Add provider info to `backend/src/api/api_keys.py` (`get_providers`)

## Database Migrations

When modifying models:

```bash
cd backend
uv run alembic revision --autogenerate -m "describe your change"
uv run alembic upgrade head
```

Review the generated migration file before applying.

## Reporting Issues

- Use [GitHub Issues](https://github.com/martian56/lumnicode/issues)
- Include steps to reproduce, expected vs actual behavior
- Include browser/OS info for frontend issues
- Include Python version and error traceback for backend issues

## Pull Request Process

1. Update documentation if you change APIs or add features
2. Ensure all checks pass (lint, build, tests)
3. Request review from a maintainer
4. Squash commits before merging when possible

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
