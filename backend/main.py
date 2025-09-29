"""
Main FastAPI application entry point for Lumnicode.
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import auth, projects, files, assist, health, debug
from src.db.database import engine, Base
from src.config import settings
from src.services.ai_service import ai_service
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lumnicode API",
    description="AI-powered online code editor backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(assist.router, prefix="/assist", tags=["assist"])
app.include_router(debug.router, prefix="/debug", tags=["debug"])


@app.on_event("startup")
async def startup_event():
    """Ensure AI service resources are initialized on startup."""
    logger.info("Starting up: initializing AI service session")
    try:
        # Enter the async context to create aiohttp sessions and sub-services
        await ai_service.__aenter__()
    except Exception as e:
        logger.warning(f"AI service failed to initialize on startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up AI service resources on shutdown."""
    logger.info("Shutdown: closing AI service session")
    try:
        await ai_service.__aexit__(None, None, None)
    except Exception as e:
        logger.warning(f"AI service failed to clean up on shutdown: {e}")

@app.get("/")
async def root():
    return {"message": "Welcome to Lumnicode API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)