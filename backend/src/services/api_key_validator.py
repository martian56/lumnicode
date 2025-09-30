"""
API Key Validation Service for multiple AI providers.
"""
import asyncio
import aiohttp
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum

from src.models.models import ProviderEnum

logger = logging.getLogger(__name__)


class ValidationResult:
    def __init__(self, is_valid: bool, error_message: str = None, quota_info: Dict[str, Any] = None):
        self.is_valid = is_valid
        self.error_message = error_message
        self.quota_info = quota_info or {}


class APIKeyValidator:
    """Validates API keys for different AI providers."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def validate_key(self, provider: ProviderEnum, api_key: str) -> ValidationResult:
        """Validate an API key for a specific provider."""
        try:
            if provider == ProviderEnum.OPENAI:
                return await self._validate_openai_key(api_key)
            elif provider == ProviderEnum.GOOGLE:
                return await self._validate_google_key(api_key)
            elif provider == ProviderEnum.ANTHROPIC:
                return await self._validate_anthropic_key(api_key)
            elif provider == ProviderEnum.HUGGINGFACE:
                return await self._validate_huggingface_key(api_key)
            elif provider == ProviderEnum.TOGETHER:
                return await self._validate_together_key(api_key)
            elif provider == ProviderEnum.FIREWORKS:
                return await self._validate_fireworks_key(api_key)
            elif provider == ProviderEnum.COHERE:
                return await self._validate_cohere_key(api_key)
            elif provider == ProviderEnum.GROQ:
                return await self._validate_groq_key(api_key)
            else:
                return ValidationResult(False, f"Unsupported provider: {provider}")
        except Exception as e:
            logger.error(f"Error validating {provider} key: {e}")
            return ValidationResult(False, f"Validation error: {str(e)}")
    
    async def _validate_openai_key(self, api_key: str) -> ValidationResult:
        """Validate OpenAI API key."""
        try:
            url = "https://api.openai.com/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    models = [model["id"] for model in data.get("data", [])]
                    
                    # Check for common models
                    available_models = []
                    for model in ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"]:
                        if any(model in m for m in models):
                            available_models.append(model)
                    
                    return ValidationResult(
                        True, 
                        quota_info={
                            "available_models": available_models,
                            "total_models": len(models)
                        }
                    )
                elif response.status == 401:
                    return ValidationResult(False, "Invalid API key")
                elif response.status == 429:
                    return ValidationResult(False, "Rate limit exceeded")
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")
    
    async def _validate_google_key(self, api_key: str) -> ValidationResult:
        """Validate Google Gemini API key."""
        try:
            url = "https://generativelanguage.googleapis.com/v1beta/models"
            params = {"key": api_key}
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    models = [model["name"] for model in data.get("models", [])]
                    
                    available_models = []
                    for model in ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"]:
                        if any(model in m for m in models):
                            available_models.append(model)
                    
                    return ValidationResult(
                        True,
                        quota_info={
                            "available_models": available_models,
                            "total_models": len(models)
                        }
                    )
                elif response.status == 400:
                    return ValidationResult(False, "Invalid API key")
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")
    
    async def _validate_anthropic_key(self, api_key: str) -> ValidationResult:
        """Validate Anthropic Claude API key."""
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            data = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "test"}]
            }
            
            async with self.session.post(url, headers=headers, json=data) as response:
                if response.status == 200:
                    return ValidationResult(True, quota_info={"available_models": ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"]})
                elif response.status == 401:
                    return ValidationResult(False, "Invalid API key")
                elif response.status == 400:
                    # Key might be valid but request format issue
                    error_data = await response.json()
                    if "invalid_api_key" in str(error_data).lower():
                        return ValidationResult(False, "Invalid API key")
                    else:
                        return ValidationResult(True, quota_info={"available_models": ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"]})
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")
    
    async def _validate_huggingface_key(self, api_key: str) -> ValidationResult:
        """Validate Hugging Face API key."""
        try:
            url = "https://huggingface.co/api/whoami-v2"
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return ValidationResult(
                        True,
                        quota_info={
                            "user": data.get("name", "Unknown"),
                            "type": data.get("type", "user")
                        }
                    )
                elif response.status == 401:
                    return ValidationResult(False, "Invalid API key")
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")
    
    async def _validate_together_key(self, api_key: str) -> ValidationResult:
        """Validate Together AI API key."""
        try:
            url = "https://api.together.xyz/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    models = [model["id"] for model in data.get("data", [])]
                    return ValidationResult(
                        True,
                        quota_info={
                            "available_models": models[:10],  # First 10 models
                            "total_models": len(models)
                        }
                    )
                elif response.status == 401:
                    return ValidationResult(False, "Invalid API key")
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")
    
    async def _validate_fireworks_key(self, api_key: str) -> ValidationResult:
        """Validate Fireworks AI API key."""
        try:
            url = "https://api.fireworks.ai/inference/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    models = [model["id"] for model in data.get("data", [])]
                    return ValidationResult(
                        True,
                        quota_info={
                            "available_models": models[:10],
                            "total_models": len(models)
                        }
                    )
                elif response.status == 401:
                    return ValidationResult(False, "Invalid API key")
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")
    
    async def _validate_cohere_key(self, api_key: str) -> ValidationResult:
        """Validate Cohere API key."""
        try:
            url = "https://api.cohere.ai/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    models = [model["name"] for model in data.get("models", [])]
                    return ValidationResult(
                        True,
                        quota_info={
                            "available_models": models,
                            "total_models": len(models)
                        }
                    )
                elif response.status == 401:
                    return ValidationResult(False, "Invalid API key")
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")
    
    async def _validate_groq_key(self, api_key: str) -> ValidationResult:
        """Validate Groq API key."""
        try:
            url = "https://api.groq.com/openai/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    models = [model["id"] for model in data.get("data", [])]
                    return ValidationResult(
                        True,
                        quota_info={
                            "available_models": models,
                            "total_models": len(models)
                        }
                    )
                elif response.status == 401:
                    return ValidationResult(False, "Invalid API key")
                else:
                    error_text = await response.text()
                    return ValidationResult(False, f"API error: {response.status} - {error_text}")
        except Exception as e:
            return ValidationResult(False, f"Network error: {str(e)}")


# Global validator instance
api_key_validator = APIKeyValidator()


async def get_api_key_validator() -> APIKeyValidator:
    """Dependency injection for API key validator."""
    return api_key_validator
