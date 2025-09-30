"""
Enhanced AI Service that supports multiple providers and user API keys.
"""
import asyncio
import aiohttp
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from enum import Enum

from src.models.models import ProviderEnum, UserAPIKey
from src.services.api_key_manager import APIKeyManager
from src.services.api_key_validator import get_api_key_validator

logger = logging.getLogger(__name__)


class AIModel(Enum):
    # OpenAI Models
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    
    # Google Models
    GEMINI_PRO = "gemini-pro"
    GEMINI_1_5_PRO = "gemini-1.5-pro"
    GEMINI_1_5_FLASH = "gemini-1.5-flash"
    
    # Anthropic Models
    CLAUDE_3_OPUS = "claude-3-opus"
    CLAUDE_3_SONNET = "claude-3-sonnet"
    CLAUDE_3_HAIKU = "claude-3-haiku"
    
    # Other Models
    LLAMA_2_70B = "llama-2-70b-chat"
    MISTRAL_7B = "mistral-7b-instruct"


class CodeSuggestion:
    def __init__(self, code: str, explanation: str, confidence: float, language: str, 
                 line_start: Optional[int] = None, line_end: Optional[int] = None):
        self.code = code
        self.explanation = explanation
        self.confidence = confidence
        self.language = language
        self.line_start = line_start
        self.line_end = line_end


class MultiProviderAIService:
    """AI service that can use multiple providers based on user API keys."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.api_key_manager: Optional[APIKeyManager] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def set_api_key_manager(self, manager: APIKeyManager):
        """Set the API key manager for this service."""
        self.api_key_manager = manager
    
    async def _get_available_providers(self, user_id: int) -> List[Tuple[ProviderEnum, UserAPIKey]]:
        """Get available providers for a user."""
        if not self.api_key_manager:
            raise ValueError("API key manager not set")
        
        available_providers = []
        for provider in ProviderEnum:
            key = self.api_key_manager.get_available_api_key(user_id, provider)
            if key:
                available_providers.append((provider, key))
        
        return available_providers
    
    async def _call_openai(self, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call OpenAI API."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4000
        }
        
        async with self.session.post(url, headers=headers, json=data) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"OpenAI API error: {response.status} - {error_text}")
                raise Exception(f"OpenAI API error: {response.status}")
            
            result = await response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _call_google(self, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call Google Gemini API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        params = {"key": api_key}
        
        # Convert messages to Gemini format
        contents = []
        for message in messages:
            if message["role"] == "user":
                contents.append({
                    "parts": [{"text": message["content"]}]
                })
            elif message["role"] == "assistant":
                contents.append({
                    "parts": [{"text": message["content"]}],
                    "role": "model"
                })
        
        data = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 4000
            }
        }
        
        async with self.session.post(url, params=params, json=data) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Google API error: {response.status} - {error_text}")
                raise Exception(f"Google API error: {response.status}")
            
            result = await response.json()
            return result["candidates"][0]["content"]["parts"][0]["text"]
    
    async def _call_anthropic(self, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call Anthropic Claude API."""
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        # Convert messages to Claude format
        system_message = ""
        claude_messages = []
        
        for message in messages:
            if message["role"] == "system":
                system_message = message["content"]
            else:
                claude_messages.append({
                    "role": message["role"],
                    "content": message["content"]
                })
        
        data = {
            "model": model,
            "max_tokens": 4000,
            "temperature": temperature,
            "messages": claude_messages
        }
        
        if system_message:
            data["system"] = system_message
        
        async with self.session.post(url, headers=headers, json=data) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Anthropic API error: {response.status} - {error_text}")
                raise Exception(f"Anthropic API error: {response.status}")
            
            result = await response.json()
            return result["content"][0]["text"]
    
    async def _call_together(self, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call Together AI API."""
        url = "https://api.together.xyz/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4000
        }
        
        async with self.session.post(url, headers=headers, json=data) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Together API error: {response.status} - {error_text}")
                raise Exception(f"Together API error: {response.status}")
            
            result = await response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _call_fireworks(self, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call Fireworks AI API."""
        url = "https://api.fireworks.ai/inference/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4000
        }
        
        async with self.session.post(url, headers=headers, json=data) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Fireworks API error: {response.status} - {error_text}")
                raise Exception(f"Fireworks API error: {response.status}")
            
            result = await response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _call_cohere(self, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call Cohere API."""
        url = "https://api.cohere.ai/v1/chat"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Convert messages to Cohere format
        chat_history = []
        message_text = ""
        
        for message in messages:
            if message["role"] == "user":
                if message_text:
                    chat_history.append({"role": "CHATBOT", "message": message_text})
                    message_text = ""
                message_text = message["content"]
            elif message["role"] == "assistant":
                chat_history.append({"role": "USER", "message": message_text})
                chat_history.append({"role": "CHATBOT", "message": message["content"]})
                message_text = ""
        
        data = {
            "model": model,
            "message": message_text,
            "chat_history": chat_history,
            "temperature": temperature,
            "max_tokens": 4000
        }
        
        async with self.session.post(url, headers=headers, json=data) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Cohere API error: {response.status} - {error_text}")
                raise Exception(f"Cohere API error: {response.status}")
            
            result = await response.json()
            return result["text"]
    
    async def _call_groq(self, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call Groq API."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4000
        }
        
        async with self.session.post(url, headers=headers, json=data) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Groq API error: {response.status} - {error_text}")
                raise Exception(f"Groq API error: {response.status}")
            
            result = await response.json()
            return result["choices"][0]["message"]["content"]
    
    async def _call_provider(self, provider: ProviderEnum, messages: List[Dict], model: str, api_key: str, temperature: float = 0.7) -> str:
        """Call the appropriate provider API."""
        if provider == ProviderEnum.OPENAI:
            return await self._call_openai(messages, model, api_key, temperature)
        elif provider == ProviderEnum.GOOGLE:
            return await self._call_google(messages, model, api_key, temperature)
        elif provider == ProviderEnum.ANTHROPIC:
            return await self._call_anthropic(messages, model, api_key, temperature)
        elif provider == ProviderEnum.TOGETHER:
            return await self._call_together(messages, model, api_key, temperature)
        elif provider == ProviderEnum.FIREWORKS:
            return await self._call_fireworks(messages, model, api_key, temperature)
        elif provider == ProviderEnum.COHERE:
            return await self._call_cohere(messages, model, api_key, temperature)
        elif provider == ProviderEnum.GROQ:
            return await self._call_groq(messages, model, api_key, temperature)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def _get_model_for_provider(self, provider: ProviderEnum) -> str:
        """Get the default model for a provider."""
        model_map = {
            ProviderEnum.OPENAI: "gpt-3.5-turbo",
            ProviderEnum.GOOGLE: "gemini-1.5-flash",
            ProviderEnum.ANTHROPIC: "claude-3-haiku",
            ProviderEnum.TOGETHER: "meta-llama/Llama-2-70b-chat-hf",
            ProviderEnum.FIREWORKS: "accounts/fireworks/models/llama-v2-70b-chat",
            ProviderEnum.COHERE: "command",
            ProviderEnum.GROQ: "llama2-70b-4096"
        }
        return model_map.get(provider, "gpt-3.5-turbo")
    
    async def generate_code_suggestion(
        self,
        user_id: int,
        code_context: str,
        cursor_position: Optional[Dict] = None,
        user_prompt: Optional[str] = None,
        language: str = "javascript"
    ) -> CodeSuggestion:
        """Generate intelligent code suggestions using available providers."""
        
        # Get available providers
        available_providers = await self._get_available_providers(user_id)
        if not available_providers:
            raise ValueError("No API keys available for AI services")
        
        # Try providers in order of preference
        for provider, api_key in available_providers:
            try:
                model = self._get_model_for_provider(provider)
                
                system_prompt = f"""You are an expert {language} developer. Provide helpful, accurate code suggestions.
                Focus on best practices, performance, and maintainability.
                Return only the code suggestion without markdown formatting."""
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Code context:\n{code_context}"}
                ]
                
                if user_prompt:
                    messages.append({"role": "user", "content": f"User request: {user_prompt}"})
                
                suggestion = await self._call_provider(provider, messages, model, api_key.api_key, temperature=0.3)
                
                # Update usage statistics
                self.api_key_manager.update_key_usage(str(api_key.id), 1)
                
                return CodeSuggestion(
                    code=suggestion.strip(),
                    explanation="AI-generated suggestion",
                    confidence=0.8,
                    language=language
                )
                
            except Exception as e:
                logger.warning(f"Provider {provider} failed: {e}")
                continue
        
        raise Exception("All available providers failed")
    
    async def analyze_code(
        self,
        user_id: int,
        code: str,
        language: str,
        context: Optional[str] = None,
        cursor_position: Optional[Dict] = None
    ) -> List[CodeSuggestion]:
        """Analyze code and provide suggestions."""
        
        available_providers = await self._get_available_providers(user_id)
        if not available_providers:
            raise ValueError("No API keys available for AI services")
        
        for provider, api_key in available_providers:
            try:
                model = self._get_model_for_provider(provider)
                
                system_prompt = f"""You are a senior {language} developer and code reviewer.
                Analyze the provided code and return a JSON object with:
                {{
                    "suggestions": [
                        {{
                            "code": "improved code",
                            "explanation": "explanation",
                            "confidence": 0.8,
                            "line_start": 1,
                            "line_end": 5
                        }}
                    ],
                    "bugs": [
                        {{
                            "line": 1,
                            "type": "logic",
                            "severity": "medium",
                            "description": "issue description",
                            "suggestion": "fix suggestion"
                        }}
                    ],
                    "complexity": {{
                        "total_lines": 50,
                        "functions": 3,
                        "complexity_score": 75,
                        "maintainability": "high"
                    }}
                }}"""
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this {language} code:\n\n{code}"}
                ]
                
                response = await self._call_provider(provider, messages, model, api_key.api_key, temperature=0.1)
                
                # Update usage statistics
                self.api_key_manager.update_key_usage(str(api_key.id), 1)
                
                try:
                    analysis_result = json.loads(response)
                    suggestions = []
                    
                    for suggestion_data in analysis_result.get("suggestions", []):
                        suggestions.append(CodeSuggestion(
                            code=suggestion_data.get("code", ""),
                            explanation=suggestion_data.get("explanation", ""),
                            confidence=suggestion_data.get("confidence", 0.8),
                            language=language,
                            line_start=suggestion_data.get("line_start"),
                            line_end=suggestion_data.get("line_end")
                        ))
                    
                    return suggestions
                    
                except json.JSONDecodeError:
                    # Fallback to simple suggestion
                    return [CodeSuggestion(
                        code=response,
                        explanation="AI code analysis",
                        confidence=0.7,
                        language=language
                    )]
                
            except Exception as e:
                logger.warning(f"Provider {provider} failed for analysis: {e}")
                continue
        
        raise Exception("All available providers failed for code analysis")
    
    async def complete_code(
        self,
        user_id: int,
        prefix: str,
        suffix: str = "",
        language: str = "javascript",
        context: Optional[str] = None
    ) -> CodeSuggestion:
        """Complete code based on context."""
        
        available_providers = await self._get_available_providers(user_id)
        if not available_providers:
            raise ValueError("No API keys available for AI services")
        
        for provider, api_key in available_providers:
            try:
                model = self._get_model_for_provider(provider)
                
                system_prompt = f"""You are an expert {language} developer. Complete the given code.
                Return only the completion without markdown formatting."""
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Complete this {language} code:\n\n{prefix}"}
                ]
                
                completion = await self._call_provider(provider, messages, model, api_key.api_key, temperature=0.3)
                
                # Update usage statistics
                self.api_key_manager.update_key_usage(str(api_key.id), 1)
                
                return CodeSuggestion(
                    code=completion.strip(),
                    explanation="AI code completion",
                    confidence=0.8,
                    language=language
                )
                
            except Exception as e:
                logger.warning(f"Provider {provider} failed for completion: {e}")
                continue
        
        raise Exception("All available providers failed for code completion")
    
    async def refactor_code(
        self,
        user_id: int,
        code: str,
        language: str,
        refactoring_type: str = "general"
    ) -> CodeSuggestion:
        """Refactor code for better quality."""
        
        available_providers = await self._get_available_providers(user_id)
        if not available_providers:
            raise ValueError("No API keys available for AI services")
        
        for provider, api_key in available_providers:
            try:
                model = self._get_model_for_provider(provider)
                
                system_prompt = f"""You are a senior {language} developer. Refactor the provided code with {refactoring_type} improvements.
                Return only the refactored code without markdown formatting."""
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Refactor this {language} code:\n\n{code}"}
                ]
                
                refactored_code = await self._call_provider(provider, messages, model, api_key.api_key, temperature=0.2)
                
                # Update usage statistics
                self.api_key_manager.update_key_usage(str(api_key.id), 1)
                
                return CodeSuggestion(
                    code=refactored_code.strip(),
                    explanation=f"AI code refactoring ({refactoring_type})",
                    confidence=0.8,
                    language=language
                )
                
            except Exception as e:
                logger.warning(f"Provider {provider} failed for refactoring: {e}")
                continue
        
        raise Exception("All available providers failed for code refactoring")
    
    async def explain_code(
        self,
        user_id: int,
        code: str,
        language: str,
        detail_level: str = "medium"
    ) -> str:
        """Explain what the code does."""
        
        available_providers = await self._get_available_providers(user_id)
        if not available_providers:
            raise ValueError("No API keys available for AI services")
        
        for provider, api_key in available_providers:
            try:
                model = self._get_model_for_provider(provider)
                
                system_prompt = f"""You are a senior {language} developer. Explain the provided code in {detail_level} detail.
                Focus on what the code does, how it works, and any important concepts."""
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Explain this {language} code:\n\n{code}"}
                ]
                
                explanation = await self._call_provider(provider, messages, model, api_key.api_key, temperature=0.1)
                
                # Update usage statistics
                self.api_key_manager.update_key_usage(str(api_key.id), 1)
                
                return explanation.strip()
                
            except Exception as e:
                logger.warning(f"Provider {provider} failed for explanation: {e}")
                continue
        
        raise Exception("All available providers failed for code explanation")

    async def generate_text(
        self,
        prompt: str,
        user_id: int,
        max_tokens: int = 2000,
        temperature: float = 0.7
    ) -> str:
        """Generate text using available providers."""
        
        available_providers = await self._get_available_providers(user_id)
        if not available_providers:
            raise ValueError("No API keys available for AI services")
        
        messages = [
            {"role": "user", "content": prompt}
        ]
        
        for provider, api_key in available_providers:
            try:
                model = self._get_model_for_provider(provider)
                response = await self._call_provider(provider, messages, model, api_key, temperature)
                return response
            except Exception as e:
                logger.warning(f"Provider {provider} failed: {str(e)}")
                continue
        
        raise Exception("All available providers failed for text generation")


# Global multi-provider AI service instance
multi_provider_ai_service = MultiProviderAIService()


async def get_multi_provider_ai_service() -> MultiProviderAIService:
    """Dependency injection for multi-provider AI service."""
    return multi_provider_ai_service
