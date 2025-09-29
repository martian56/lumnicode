"""
File management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.database import (
    get_user_by_clerk_id,
    get_files_by_project,
    get_file_by_id,
    create_file,
    update_file,
    delete_file
)
from src.schemas.schemas import File, FileCreate, FileUpdate, UserCreate
from src.services.database import create_user
from src.config import settings
import os
from pathlib import Path

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


@router.get("/", response_model=List[File])
async def get_files(
    project_id: Optional[UUID] = Query(None, description="Project ID to filter files"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Get files, optionally filtered by project."""
    if project_id:
        return get_files_by_project(db, project_id, current_user.id)
    else:
        # If no project_id provided, return empty list or all user's files
        return []


@router.post("/", response_model=File, status_code=status.HTTP_201_CREATED)
async def create_new_file(
    request: Request,
    file: FileCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Create a new file."""
    # Log the raw request body for debugging
    body = await request.body()
    print(f"Raw request body: {body}")
    print(f"Received file creation request: {file}")
    try:
        # Convert project_id string to UUID
        try:
            project_uuid = UUID(file.project_id)
            print(f"Converted project_id to UUID: {project_uuid}")
        except ValueError as e:
            print(f"Invalid project_id format: {file.project_id}, error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project_id format"
            )
        
        # Create file data with UUID project_id
        file_data = {
            'name': file.name,
            'path': file.path,
            'content': file.content,
            'language': file.language,
            'project_id': project_uuid
        }
        print(f"File data to create: {file_data}")
        
        db_file = create_file(db, file_data, current_user.id)
        if not db_file:
            print("Project not found or access denied")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or access denied"
            )
        # Create the file on disk in the project's workspace
        try:
            projects_root = Path(settings.projects_root)
            project_folder = projects_root / str(project_uuid)
            full_path = project_folder / Path(file.path)
            full_path.parent.mkdir(parents=True, exist_ok=True)
            # write content
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(file.content or '')
            print(f"Wrote file to disk at {full_path}")
        except Exception as e:
            print(f"Warning: failed to write file to disk: {e}")
        print(f"Successfully created file: {db_file.id}")
        return db_file
    except Exception as e:
        # Log the error for debugging
        print(f"Error creating file: {e}")
        print(f"File data: {file}")
        raise


@router.get("/{file_id}", response_model=File)
async def get_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Get a specific file."""
    db_file = get_file_by_id(db, file_id, current_user.id)
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return db_file


@router.put("/{file_id}", response_model=File)
async def update_file_info(
    file_id: UUID,
    file_update: FileUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Update a file."""
    db_file = update_file(db, file_id, file_update, current_user.id)
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return db_file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file_endpoint(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_db_user)
):
    """Delete a file."""
    if not delete_file(db, file_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )