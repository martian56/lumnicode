"""
AI Service for Lumnicode - Comprehensive AI-powered development platform.
"""
import os
import json
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any, Tuple
import logging
from pathlib import Path

from .models import (
    AIModel, ProjectType, CodeSuggestion, ProjectTemplate, GeneratedProject
)
from .deployment_service import DeploymentService, DeploymentPlatform
from .github_service import GitHubService

logger = logging.getLogger(__name__)


class AIService:
    """Main AI service class for Lumnicode."""

    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

        if not self.openai_api_key:
            logger.warning("OpenAI API key not found. AI features will be limited.")

        self.session: Optional[aiohttp.ClientSession] = None

        # Initialize sub-services (deferred imports to avoid circular dependencies)
        from .code_analyzer import CodeAnalyzer
        from .project_generator import ProjectGenerator
        
        self.code_analyzer = CodeAnalyzer(self)
        self.deployment_service = DeploymentService()
        self.github_service = GitHubService()
        self.project_generator = ProjectGenerator(self)

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        await self.deployment_service.__aenter__()
        await self.github_service.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        await self.deployment_service.__aexit__(exc_type, exc_val, exc_tb)
        await self.github_service.__aexit__(exc_type, exc_val, exc_tb)

    async def _call_openai(self, messages: List[Dict], model: AIModel = AIModel.GPT_4, temperature: float = 0.7) -> str:
        """Call OpenAI API."""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")

        if not self.session:
            raise RuntimeError("AIService not properly initialized")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": model.value,
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

    async def generate_code_suggestion(
        self,
        code_context: str,
        cursor_position: Optional[Dict] = None,
        user_prompt: Optional[str] = None,
        language: str = "javascript"
    ) -> CodeSuggestion:
        """Generate intelligent code suggestions."""

        system_prompt = f"""You are an expert {language} developer. Provide helpful, accurate code suggestions.
        Focus on best practices, performance, and maintainability.
        Return only the code suggestion without markdown formatting."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Code context:\n{code_context}"}
        ]

        if user_prompt:
            messages.append({"role": "user", "content": f"User request: {user_prompt}"})

        suggestion = await self._call_openai(messages, AIModel.GPT_4, temperature=0.3)

        return CodeSuggestion(
            code=suggestion.strip(),
            explanation="AI-generated suggestion",
            confidence=0.8,
            language=language
        )

    async def generate_project(
        self,
        description: str,
        project_type: ProjectType = ProjectType.WEB_APP,
        tech_stack: Optional[List[str]] = None
    ) -> GeneratedProject:
        """Generate a complete project from natural language description."""
        return await self.project_generator.generate_from_description(
            description, project_type, tech_stack
        )

    async def analyze_code_quality(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code quality and provide improvement suggestions."""

        system_prompt = f"""You are a senior {language} developer and code reviewer.
        Analyze the provided code and return a JSON object with:
        {{
            "score": 0-100,
            "issues": ["list of issues"],
            "suggestions": ["improvement suggestions"],
            "best_practices": ["followed best practices"]
        }}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze this {language} code:\n\n{code}"}
        ]

        response = await self._call_openai(messages, AIModel.GPT_3_5_TURBO, temperature=0.1)

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "score": 75,
                "issues": ["Unable to analyze code automatically"],
                "suggestions": ["Manual code review recommended"],
                "best_practices": ["Code appears functional"]
            }

    async def generate_deployment_config(
        self,
        project_type: ProjectType,
        tech_stack: List[str]
    ) -> Dict[str, Any]:
        """Generate deployment configuration for various platforms."""

        system_prompt = """Generate deployment configurations for modern web platforms.
        Return a JSON object with deployment configs for multiple platforms."""

        user_prompt = f"""
        Generate deployment configurations for a {project_type.value} with tech stack: {', '.join(tech_stack)}
        Include configs for: Vercel, Netlify, Railway, Render, and Heroku
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self._call_openai(messages, AIModel.GPT_3_5_TURBO, temperature=0.1)

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "vercel": {"framework": "nextjs" if "next" in str(tech_stack).lower() else None},
                "netlify": {"build_command": "npm run build", "publish_directory": "dist"}
            }

    async def create_github_repo(
        self,
        name: str,
        description: str,
        is_private: bool = False
    ) -> Dict[str, Any]:
        """Create a GitHub repository."""
        return await self.github_service.create_repository(name, description, is_private)

    async def push_to_github(
        self,
        repo_name: str,
        files: Dict[str, str],
        commit_message: str = "Initial commit"
    ) -> bool:
        """Push files to GitHub repository."""
        # Extract owner from repo_name (format: owner/repo)
        if "/" not in repo_name:
            raise ValueError("repo_name must be in format 'owner/repo'")

        owner, repo = repo_name.split("/", 1)
        result = await self.github_service.create_commit(
            owner, repo, files, commit_message
        )
        return result.get("success", False)

    async def deploy_project(
        self,
        project_files: Dict[str, str],
        platform: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Deploy project to specified platform."""
        try:
            deployment_platform = DeploymentPlatform(platform.lower())
            # Create a temporary directory for the project files
            import tempfile
            import os

            with tempfile.TemporaryDirectory() as temp_dir:
                # Write files to temp directory
                for filename, content in project_files.items():
                    filepath = os.path.join(temp_dir, filename)
                    os.makedirs(os.path.dirname(filepath), exist_ok=True)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)

                return await self.deployment_service.deploy_project(
                    temp_dir, deployment_platform, config
                )
        except ValueError:
            raise ValueError(f"Unsupported deployment platform: {platform}")

    # Convenience methods for sub-services

    async def analyze_code(
        self,
        code: str,
        language: str,
        context: Optional[str] = None,
        cursor_position: Optional[Dict] = None
    ) -> List[CodeSuggestion]:
        """Analyze code and provide suggestions."""
        return await self.code_analyzer.analyze_and_suggest(
            code, language, context, cursor_position
        )

    async def complete_code(
        self,
        prefix: str,
        suffix: str = "",
        language: str = "javascript",
        context: Optional[str] = None
    ) -> CodeSuggestion:
        """Complete code based on context."""
        return await self.code_analyzer.complete_code(prefix, suffix, language, context)

    async def refactor_code(
        self,
        code: str,
        language: str,
        refactoring_type: str = "general"
    ) -> CodeSuggestion:
        """Refactor code for better quality."""
        return await self.code_analyzer.refactor_code(code, language, refactoring_type)

    async def explain_code(self, code: str, language: str, detail_level: str = "medium") -> str:
        """Explain what the code does."""
        return await self.code_analyzer.explain_code(code, language, detail_level)

    async def detect_bugs(self, code: str, language: str) -> List[Dict[str, Any]]:
        """Detect potential bugs in code."""
        return await self.code_analyzer.detect_bugs(code, language)

    def analyze_complexity(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code complexity."""
        return self.code_analyzer.analyze_complexity(code, language)

    def get_supported_deployment_platforms(self) -> List[str]:
        """Get list of supported deployment platforms."""
        return self.deployment_service.get_supported_platforms()

    async def get_deployment_status(
        self,
        platform: str,
        deployment_id: str
    ) -> Dict[str, Any]:
        """Get deployment status."""
        try:
            deployment_platform = DeploymentPlatform(platform.lower())
            return await self.deployment_service.get_deployment_status(
                deployment_platform, deployment_id
            )
        except ValueError:
            return {"status": "error", "error": f"Unsupported platform: {platform}"}

    async def get_github_repositories(self, username: str) -> List[Dict[str, Any]]:
        """Get user's GitHub repositories."""
        return await self.github_service.get_user_repositories(username)

    async def fork_github_repo(self, owner: str, repo: str) -> Dict[str, Any]:
        """Fork a GitHub repository."""
        return await self.github_service.fork_repository(owner, repo)

    async def create_github_pr(
        self,
        owner: str,
        repo: str,
        title: str,
        head: str,
        base: str = "main",
        body: str = ""
    ) -> Dict[str, Any]:
        """Create a GitHub pull request."""
        return await self.github_service.create_pull_request(
            owner, repo, title, head, base, body
        )


# Global AI service instance
ai_service = AIService()


async def get_ai_service() -> AIService:
    """Dependency injection for AI service."""
    return ai_service