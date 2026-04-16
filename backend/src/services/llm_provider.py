"""
Unified LLM provider layer using LangChain ChatModel abstractions.
Replaces the dual AIService/MultiProviderAIService with a single interface.
"""
import logging
from typing import Optional

from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy.orm import Session

from src.models.models import ProviderEnum
from src.services.api_key_manager import APIKeyManager

logger = logging.getLogger(__name__)

# Default models per provider
DEFAULT_MODELS = {
    ProviderEnum.OPENAI: "gpt-4o-mini",
    ProviderEnum.GOOGLE: "gemini-1.5-flash",
    ProviderEnum.ANTHROPIC: "claude-3-haiku-20240307",
    ProviderEnum.TOGETHER: "meta-llama/Llama-3-70b-chat-hf",
    ProviderEnum.FIREWORKS: "accounts/fireworks/models/llama-v3p1-70b-instruct",
    ProviderEnum.GROQ: "llama-3.1-70b-versatile",
    ProviderEnum.COHERE: "command-r",
}

# OpenAI-compatible API base URLs
OPENAI_COMPATIBLE_URLS = {
    ProviderEnum.TOGETHER: "https://api.together.xyz/v1",
    ProviderEnum.FIREWORKS: "https://api.fireworks.ai/inference/v1",
    ProviderEnum.GROQ: "https://api.groq.com/openai/v1",
}

# Provider priority order for fallback
PROVIDER_PRIORITY = [
    ProviderEnum.OPENAI,
    ProviderEnum.ANTHROPIC,
    ProviderEnum.GOOGLE,
    ProviderEnum.GROQ,
    ProviderEnum.TOGETHER,
    ProviderEnum.FIREWORKS,
    ProviderEnum.COHERE,
]


def get_chat_model(
    provider: ProviderEnum,
    api_key: str,
    model: Optional[str] = None,
    temperature: float = 0.7,
    streaming: bool = False,
) -> BaseChatModel:
    """Create a LangChain ChatModel for the given provider."""
    model_name = model or DEFAULT_MODELS.get(provider, "gpt-4o-mini")

    if provider == ProviderEnum.OPENAI:
        return ChatOpenAI(
            api_key=api_key,
            model=model_name,
            temperature=temperature,
            streaming=streaming,
            request_timeout=30,
        )
    elif provider == ProviderEnum.ANTHROPIC:
        return ChatAnthropic(
            api_key=api_key,
            model_name=model_name,
            temperature=temperature,
            streaming=streaming,
            timeout=30,
        )
    elif provider == ProviderEnum.GOOGLE:
        return ChatGoogleGenerativeAI(
            google_api_key=api_key,
            model=model_name,
            temperature=temperature,
        )
    elif provider in OPENAI_COMPATIBLE_URLS:
        # Together, Fireworks, Groq all use OpenAI-compatible APIs
        return ChatOpenAI(
            api_key=api_key,
            model=model_name,
            temperature=temperature,
            streaming=streaming,
            base_url=OPENAI_COMPATIBLE_URLS[provider],
            request_timeout=30,
        )
    else:
        # Fallback: try as OpenAI-compatible
        return ChatOpenAI(
            api_key=api_key,
            model=model_name,
            temperature=temperature,
            streaming=streaming,
            request_timeout=30,
        )


def get_user_chat_model(
    user_id: int,
    db: Session,
    preferred_provider: Optional[ProviderEnum] = None,
    streaming: bool = False,
    temperature: float = 0.7,
) -> Optional[BaseChatModel]:
    """
    Get a ChatModel using the user's stored API keys.
    Tries preferred_provider first, then falls back through priority order.
    Returns None if no provider is available.
    """
    manager = APIKeyManager(db)

    providers_to_try = []
    if preferred_provider:
        providers_to_try.append(preferred_provider)
    providers_to_try.extend(
        p for p in PROVIDER_PRIORITY if p != preferred_provider
    )

    for provider in providers_to_try:
        api_key_obj = manager.get_available_api_key(user_id, provider)
        if api_key_obj:
            try:
                chat_model = get_chat_model(
                    provider=provider,
                    api_key=api_key_obj.api_key,
                    temperature=temperature,
                    streaming=streaming,
                )
                logger.info(
                    "Using provider %s for user %s", provider.value, user_id
                )
                return chat_model
            except Exception as e:
                logger.warning(
                    "Failed to create ChatModel for provider %s: %s",
                    provider.value, e
                )
                continue

    logger.warning("No available AI provider for user %s", user_id)
    return None
