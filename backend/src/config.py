"""
Configuration settings for the Lumnicode backend.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/lumnicode")
    
    # Clerk Authentication
    clerk_secret_key: str = os.getenv("CLERK_SECRET_KEY", "")
    clerk_publishable_key: str = os.getenv("CLERK_PUBLISHABLE_KEY", "")

    # OpenAI API
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

    # Application
    app_name: str = os.getenv("APP_NAME", "Lumnicode")
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"

    # CORS origins - Allow Docker network and localhost
    cors_origins: str = "*"  # For development, allow all origins
    # Projects storage root (legacy on-disk workspace, being replaced by S3)
    projects_root: str = os.getenv("PROJECTS_ROOT", "./projects_storage")

    # S3 / MinIO object storage
    s3_endpoint_url: str = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
    s3_access_key: str = os.getenv("S3_ACCESS_KEY", "lumnicode")
    s3_secret_key: str = os.getenv("S3_SECRET_KEY", "lumnicode123")
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "lumnicode-files")
    s3_region: str = os.getenv("S3_REGION", "us-east-1")
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Convert CORS origins string to list."""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()