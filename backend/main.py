"""
Main FastAPI application entry point for Lumnicode.
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import auth, projects, files, assist, health, debug, api_keys, websocket, ai_generation, streaming
from src.db.database import engine, Base
from src.config import settings
from src.services.storage_service import storage_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lumnicode API",
    description="AI-powered online code editor backend",
    version="2.0.0"
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
app.include_router(api_keys.router, prefix="/api-keys", tags=["api-keys"])
app.include_router(websocket.router, tags=["websocket"])
app.include_router(ai_generation.router, prefix="/ai", tags=["ai-generation"])
app.include_router(streaming.router, prefix="/assist", tags=["streaming"])


@app.on_event("startup")
async def startup_event():
    """Verify S3 storage connectivity on startup."""
    logger.info("Starting up: checking S3 storage connectivity")
    try:
        healthy = await storage_service.health_check()
        if healthy:
            logger.info("S3 storage connected successfully")
        else:
            logger.warning("S3 storage not available — file operations may fail")
    except Exception as e:
        logger.warning("S3 health check failed: %s", e)


@app.get("/")
async def root():
    return {"message": "Welcome to Lumnicode API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
