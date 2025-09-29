"""
Project management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.database import (
    get_user_by_clerk_id,
    get_projects_by_user,
    get_project_by_id,
    create_project,
    update_project,
    delete_project,
    create_user
)
from src.schemas.schemas import Project, ProjectCreate, ProjectUpdate, UserCreate

router = APIRouter()


async def get_current_db_user(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user from database, create if doesn't exist."""
    db_user = get_user_by_clerk_id(db, current_user["clerk_id"])
    if not db_user:
        # Create user if they don't exist in our database
        user_create = UserCreate(
            clerk_id=current_user["clerk_id"],
            email=current_user["email"],
            first_name=current_user.get("first_name"),
            last_name=current_user.get("last_name")
        )
        db_user = create_user(db, user_create)
    return db_user


@router.get("/", response_model=List[Project])
async def get_projects(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Get all projects for the current user."""
    return get_projects_by_user(db, current_user.id)


@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_new_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Create a new project."""
    return create_project(db, project, current_user.id)


@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Get a specific project."""
    db_project = get_project_by_id(db, project_id, current_user.id)
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return db_project


@router.put("/{project_id}", response_model=Project)
async def update_project_info(
    project_id: UUID,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Update a project."""
    db_project = update_project(db, project_id, project_update, current_user.id)
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return db_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_endpoint(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Delete a project."""
    if not delete_project(db, project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )