"""
File management endpoints with S3 storage.
"""
import logging
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
from src.services.storage_service import storage_service

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_current_db_user(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user from database, create if doesn't exist."""
    db_user = get_user_by_clerk_id(db, current_user["clerk_id"])
    if not db_user:
        user_create = UserCreate(
            clerk_id=current_user["clerk_id"],
            email=current_user["email"],
            first_name=current_user.get("first_name"),
            last_name=current_user.get("last_name")
        )
        db_user = create_user(db, user_create)
    return db_user


async def _populate_content_from_s3(db_file) -> dict:
    """Populate content field from S3 if the file uses S3 storage."""
    file_dict = {
        "id": db_file.id,
        "name": db_file.name,
        "path": db_file.path,
        "language": db_file.language,
        "project_id": db_file.project_id,
        "s3_key": db_file.s3_key,
        "size_bytes": db_file.size_bytes or 0,
        "created_at": db_file.created_at,
        "updated_at": db_file.updated_at,
    }
    if db_file.s3_key:
        content = await storage_service.get_object(db_file.s3_key)
        file_dict["content"] = content or ""
    else:
        file_dict["content"] = db_file.content or ""
    return file_dict


@router.get("/", response_model=List[File])
async def get_files(
    project_id: Optional[UUID] = Query(None, description="Project ID to filter files"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_db_user)
):
    """Get files, optionally filtered by project."""
    if not project_id:
        return []
    db_files = get_files_by_project(db, project_id, current_user.id)
    result = []
    for f in db_files:
        file_dict = await _populate_content_from_s3(f)
        result.append(file_dict)
    return result


@router.post("/", response_model=File, status_code=status.HTTP_201_CREATED)
async def create_new_file(
    request: Request,
    file: FileCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_db_user)
):
    """Create a new file. Content is stored in S3."""
    try:
        project_uuid = UUID(file.project_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id format"
        )

    content = file.content or ""
    s3_key = storage_service._make_key(str(project_uuid), file.path)

    # Write content to S3
    uploaded = await storage_service.put_object(s3_key, content)
    if not uploaded:
        logger.warning("S3 upload failed for %s, storing in DB", s3_key)

    file_data = {
        "name": file.name,
        "path": file.path,
        "content": None if uploaded else content,
        "language": file.language,
        "project_id": project_uuid,
        "s3_key": s3_key if uploaded else None,
        "size_bytes": len(content.encode("utf-8")),
    }

    db_file = create_file(db, file_data, current_user.id)
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )

    result = await _populate_content_from_s3(db_file)
    return result


@router.get("/{file_id}", response_model=File)
async def get_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_db_user)
):
    """Get a specific file with content from S3."""
    db_file = get_file_by_id(db, file_id, current_user.id)
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return await _populate_content_from_s3(db_file)


@router.put("/{file_id}", response_model=File)
async def update_file_info(
    file_id: UUID,
    file_update: FileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_db_user)
):
    """Update a file. If content changed, update S3."""
    db_file = get_file_by_id(db, file_id, current_user.id)
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # If content is being updated, write to S3
    if file_update.content is not None:
        s3_key = db_file.s3_key
        if not s3_key:
            s3_key = storage_service._make_key(str(db_file.project_id), db_file.path)

        uploaded = await storage_service.put_object(s3_key, file_update.content)
        if uploaded:
            # Update the DB record: clear content, set s3_key
            from src.schemas.schemas import FileUpdate as FU
            db_update = FU(
                name=file_update.name,
                path=file_update.path,
                content=None,
                language=file_update.language,
            )
            db_file = update_file(db, file_id, db_update, current_user.id)
            # Update s3_key and size directly
            db_file.s3_key = s3_key
            db_file.size_bytes = len(file_update.content.encode("utf-8"))
            db.commit()
            db.refresh(db_file)
        else:
            # S3 failed, fall back to DB
            db_file = update_file(db, file_id, file_update, current_user.id)
    else:
        db_file = update_file(db, file_id, file_update, current_user.id)

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return await _populate_content_from_s3(db_file)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file_endpoint(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_db_user)
):
    """Delete a file from S3 and database."""
    db_file = get_file_by_id(db, file_id, current_user.id)
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Delete from S3
    if db_file.s3_key:
        await storage_service.delete_object(db_file.s3_key)

    if not delete_file(db, file_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
