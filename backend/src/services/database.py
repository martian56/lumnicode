"""
Database service functions.
"""
from sqlalchemy.orm import Session
from uuid import UUID
from src.models.models import User, Project, File
from src.schemas.schemas import UserCreate, UserUpdate, ProjectCreate, ProjectUpdate, FileCreate, FileUpdate
from typing import Optional, List


# User CRUD operations
def get_user_by_clerk_id(db: Session, clerk_id: str) -> Optional[User]:
    """Get user by Clerk ID."""
    return db.query(User).filter(User.clerk_id == clerk_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user."""
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """Update user information."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user


# Project CRUD operations
def get_projects_by_user(db: Session, user_id: int) -> List[Project]:
    """Get all projects for a user."""
    return db.query(Project).filter(Project.owner_id == user_id).all()


def get_project_by_id(db: Session, project_id: UUID, user_id: int) -> Optional[Project]:
    """Get project by ID and user ID."""
    return db.query(Project).filter(
        Project.id == project_id, 
        Project.owner_id == user_id
    ).first()


def create_project(db: Session, project: ProjectCreate, user_id: int) -> Project:
    """Create a new project."""
    db_project = Project(**project.model_dump(), owner_id=user_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def update_project(db: Session, project_id: UUID, project_update: ProjectUpdate, user_id: int) -> Optional[Project]:
    """Update project information."""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == user_id
    ).first()
    if db_project:
        update_data = project_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_project, field, value)
        db.commit()
        db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: UUID, user_id: int) -> bool:
    """Delete a project."""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == user_id
    ).first()
    if db_project:
        db.delete(db_project)
        db.commit()
        return True
    return False


# File CRUD operations
def get_files_by_project(db: Session, project_id: UUID, user_id: int) -> List[File]:
    """Get all files for a project."""
    return db.query(File).join(Project).filter(
        File.project_id == project_id,
        Project.owner_id == user_id
    ).all()


def get_file_by_id(db: Session, file_id: UUID, user_id: int) -> Optional[File]:
    """Get file by ID and user ID."""
    return db.query(File).join(Project).filter(
        File.id == file_id,
        Project.owner_id == user_id
    ).first()


def create_file(db: Session, file_data: dict, user_id: int) -> Optional[File]:
    """Create a new file."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == file_data['project_id'],
        Project.owner_id == user_id
    ).first()
    if not project:
        return None
    
    db_file = File(**file_data)
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def update_file(db: Session, file_id: UUID, file_update: FileUpdate, user_id: int) -> Optional[File]:
    """Update file information."""
    db_file = db.query(File).join(Project).filter(
        File.id == file_id,
        Project.owner_id == user_id
    ).first()
    if db_file:
        update_data = file_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_file, field, value)
        db.commit()
        db.refresh(db_file)
    return db_file


def delete_file(db: Session, file_id: UUID, user_id: int) -> bool:
    """Delete a file."""
    db_file = db.query(File).join(Project).filter(
        File.id == file_id,
        Project.owner_id == user_id
    ).first()
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False