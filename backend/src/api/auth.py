"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.services.auth import get_current_user
from src.services.database import get_user_by_clerk_id, create_user
from src.schemas.schemas import User, UserCreate

router = APIRouter()


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information."""
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