"""
API Key Management Service for user API keys.
"""
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta

from src.models.models import UserAPIKey, ProviderEnum, User
from src.services.api_key_validator import get_api_key_validator, ValidationResult

logger = logging.getLogger(__name__)


class APIKeyManager:
    """Manages user API keys with validation and usage tracking."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def add_api_key(
        self, 
        user_id: int, 
        provider: ProviderEnum, 
        api_key: str, 
        display_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add a new API key for a user."""
        try:
            # Validate the API key first
            validator = await get_api_key_validator()
            async with validator:
                validation_result = await validator.validate_key(provider, api_key)
            
            if not validation_result.is_valid:
                return {
                    "success": False,
                    "error": validation_result.error_message
                }
            
            # Check if user already has a key for this provider with same display name
            existing_key = self.db.query(UserAPIKey).filter(
                and_(
                    UserAPIKey.user_id == user_id,
                    UserAPIKey.provider == provider,
                    UserAPIKey.display_name == display_name
                )
            ).first()
            
            if existing_key:
                # Update existing key
                existing_key.api_key = api_key
                existing_key.is_validated = True
                existing_key.last_validated_at = datetime.utcnow()
                self.db.commit()
                
                return {
                    "success": True,
                    "message": f"Updated {provider.value} API key successfully",
                    "key_id": str(existing_key.id),
                    "quota_info": validation_result.quota_info
                }
            else:
                # Create new key
                new_key = UserAPIKey(
                    user_id=user_id,
                    provider=provider,
                    api_key=api_key,
                    display_name=display_name or f"{provider.value} Key",
                    is_validated=True,
                    last_validated_at=datetime.utcnow()
                )
                
                self.db.add(new_key)
                self.db.commit()
                self.db.refresh(new_key)
                
                return {
                    "success": True,
                    "message": f"Added {provider.value} API key successfully",
                    "key_id": str(new_key.id),
                    "quota_info": validation_result.quota_info
                }
                
        except Exception as e:
            logger.error(f"Error adding API key: {e}")
            self.db.rollback()
            return {
                "success": False,
                "error": f"Failed to add API key: {str(e)}"
            }
    
    def get_user_api_keys(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all API keys for a user."""
        keys = self.db.query(UserAPIKey).filter(
            UserAPIKey.user_id == user_id
        ).all()
        
        return [
            {
                "id": str(key.id),
                "provider": key.provider.value,
                "display_name": key.display_name,
                "is_active": key.is_active,
                "is_validated": key.is_validated,
                "last_validated_at": key.last_validated_at.isoformat() if key.last_validated_at else None,
                "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                "usage_count": key.usage_count,
                "monthly_limit": key.monthly_limit,
                "current_month_usage": key.current_month_usage,
                "rate_limit_per_minute": key.rate_limit_per_minute,
                "created_at": key.created_at.isoformat(),
                "quota_info": None  # No longer stored in database
            }
            for key in keys
        ]
    
    def get_available_api_key(self, user_id: int, provider: ProviderEnum) -> Optional[UserAPIKey]:
        """Get an available API key for a specific provider."""
        # Get active, validated keys for the provider
        key = self.db.query(UserAPIKey).filter(
            and_(
                UserAPIKey.user_id == user_id,
                UserAPIKey.provider == provider,
                UserAPIKey.is_active == True,
                UserAPIKey.is_validated == True
            )
        ).first()
        
        if not key:
            return None
        
        # Check rate limiting (simple implementation)
        now = datetime.utcnow()
        if key.last_used_at:
            time_since_last_use = (now - key.last_used_at).total_seconds()
            if time_since_last_use < 60:  # Within last minute
                # Could implement more sophisticated rate limiting here
                pass
        
        # Check monthly limits
        if key.monthly_limit and key.current_month_usage >= key.monthly_limit:
            logger.warning(f"Monthly limit exceeded for key {key.id}")
            return None
        
        return key
    
    def update_key_usage(self, key_id: str, tokens_used: int = 1):
        """Update usage statistics for an API key."""
        try:
            key = self.db.query(UserAPIKey).filter(UserAPIKey.id == key_id).first()
            if key:
                key.usage_count += 1
                key.current_month_usage += tokens_used
                key.last_used_at = datetime.utcnow()
                self.db.commit()
        except Exception as e:
            logger.error(f"Error updating key usage: {e}")
            self.db.rollback()
    
    def deactivate_key(self, key_id: str, user_id: int) -> bool:
        """Deactivate an API key."""
        try:
            key = self.db.query(UserAPIKey).filter(
                and_(
                    UserAPIKey.id == key_id,
                    UserAPIKey.user_id == user_id
                )
            ).first()
            
            if key:
                key.is_active = False
                self.db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deactivating key: {e}")
            self.db.rollback()
            return False
    
    def delete_key(self, key_id: str, user_id: int) -> bool:
        """Delete an API key."""
        try:
            key = self.db.query(UserAPIKey).filter(
                and_(
                    UserAPIKey.id == key_id,
                    UserAPIKey.user_id == user_id
                )
            ).first()
            
            if key:
                self.db.delete(key)
                self.db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting key: {e}")
            self.db.rollback()
            return False
    
    async def validate_all_keys(self, user_id: int) -> Dict[str, Any]:
        """Validate all API keys for a user."""
        keys = self.db.query(UserAPIKey).filter(
            and_(
                UserAPIKey.user_id == user_id,
                UserAPIKey.is_active == True
            )
        ).all()
        
        results = {}
        validator = await get_api_key_validator()
        
        async with validator:
            for key in keys:
                try:
                    validation_result = await validator.validate_key(key.provider, key.api_key)
                    
                    # Update validation status
                    key.is_validated = validation_result.is_valid
                    key.last_validated_at = datetime.utcnow()
                    if validation_result.quota_info:
                        key.quota_info = validation_result.quota_info
                    
                    results[str(key.id)] = {
                        "provider": key.provider.value,
                        "display_name": key.display_name,
                        "is_valid": validation_result.is_valid,
                        "error": validation_result.error_message,
                        "quota_info": validation_result.quota_info
                    }
                except Exception as e:
                    logger.error(f"Error validating key {key.id}: {e}")
                    results[str(key.id)] = {
                        "provider": key.provider.value,
                        "display_name": key.display_name,
                        "is_valid": False,
                        "error": str(e)
                    }
        
        self.db.commit()
        return results
    
    def reset_monthly_usage(self):
        """Reset monthly usage for all keys (should be called monthly)."""
        try:
            self.db.query(UserAPIKey).update({"current_month_usage": 0})
            self.db.commit()
            logger.info("Reset monthly usage for all API keys")
        except Exception as e:
            logger.error(f"Error resetting monthly usage: {e}")
            self.db.rollback()
    
    def get_usage_stats(self, user_id: int) -> Dict[str, Any]:
        """Get usage statistics for a user."""
        keys = self.db.query(UserAPIKey).filter(UserAPIKey.user_id == user_id).all()
        
        total_usage = sum(key.usage_count for key in keys)
        active_keys = len([key for key in keys if key.is_active and key.is_validated])
        providers = list(set(key.provider.value for key in keys))
        
        return {
            "total_keys": len(keys),
            "active_keys": active_keys,
            "total_usage": total_usage,
            "providers": providers,
            "keys": [
                {
                    "provider": key.provider.value,
                    "display_name": key.display_name,
                    "usage_count": key.usage_count,
                    "current_month_usage": key.current_month_usage,
                    "monthly_limit": key.monthly_limit,
                    "is_active": key.is_active,
                    "is_validated": key.is_validated
                }
                for key in keys
            ]
        }
