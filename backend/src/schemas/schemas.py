"""
Pydantic schemas for API request/response models.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserCreate(UserBase):
    clerk_id: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class User(UserBase):
    id: int
    clerk_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Project schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    tech_stack: Optional[List[str]] = None
    project_type: str = "web"
    template: Optional[str] = None
    status: str = "active"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    tech_stack: Optional[List[str]] = None
    project_type: Optional[str] = None
    template: Optional[str] = None
    status: Optional[str] = None


class Project(ProjectBase):
    id: UUID
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProjectWithFiles(Project):
    files: List["File"] = []


# File schemas
class FileBase(BaseModel):
    name: str
    path: str
    content: str = ""
    language: str = "text"


class FileCreate(FileBase):
    project_id: str  # Accept string, will be converted to UUID in endpoint


class FileUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None


class File(FileBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# AI Assist schemas
class AssistRequest(BaseModel):
    file_content: str
    cursor_position: Optional[dict] = None
    prompt: Optional[str] = None
    language: Optional[str] = None


class AssistResponse(BaseModel):
    suggestion: str
    confidence: float = 0.0


# Health check schema
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime