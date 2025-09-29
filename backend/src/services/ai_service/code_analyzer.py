"""
Code analysis and assistance service.
"""
import re
import json
from typing import Dict, List, Optional, Any, Tuple, TYPE_CHECKING
from .models import CodeSuggestion
import logging

if TYPE_CHECKING:
    from . import AIService

logger = logging.getLogger(__name__)


class CodeAnalyzer:
    """AI-powered code analysis and assistance."""

    def __init__(self, ai_service: "AIService"):
        self.ai_service = ai_service

    async def analyze_and_suggest(
        self,
        code: str,
        language: str,
        context: Optional[str] = None,
        cursor_position: Optional[Dict] = None
    ) -> List[CodeSuggestion]:
        """Analyze code and provide intelligent suggestions."""

        system_prompt = f"""You are an expert {language} developer and code reviewer.
        Analyze the provided code and suggest improvements.

        Return a JSON array of suggestions with this structure:
        [{{
            "code": "the suggested code",
            "explanation": "why this suggestion is good",
            "confidence": 0.0-1.0,
            "type": "completion|refactor|fix|optimization",
            "line_start": 1,
            "line_end": 5
        }}]"""

        user_prompt = f"""
        Analyze this {language} code{' at cursor position' if cursor_position else ''}:

        {code}

        {'Context: ' + context if context else ''}
        {'Cursor at line ' + str(cursor_position.get('line', 0)) if cursor_position else ''}

        Provide specific, actionable suggestions for improvement.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self.ai_service._call_openai(messages, temperature=0.3)

        try:
            suggestions_data = json.loads(response)
            suggestions = []

            for item in suggestions_data:
                suggestion = CodeSuggestion(
                    code=item["code"],
                    explanation=item["explanation"],
                    confidence=item["confidence"],
                    language=language,
                    line_start=item.get("line_start"),
                    line_end=item.get("line_end")
                )
                suggestions.append(suggestion)

            return suggestions
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse suggestions: {e}")
            return []

    async def complete_code(
        self,
        prefix: str,
        suffix: str = "",
        language: str = "javascript",
        context: Optional[str] = None
    ) -> CodeSuggestion:
        """Complete code based on prefix and context."""

        system_prompt = f"""You are an expert {language} developer. Complete the code intelligently.
        Return only the completion code without explanation."""

        user_prompt = f"""
        Complete this {language} code:

        Prefix: {prefix}
        Suffix: {suffix}
        {'Context: ' + context if context else ''}

        Provide the most likely completion that fits the context.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        completion = await self.ai_service._call_openai(messages, temperature=0.1)

        return CodeSuggestion(
            code=completion.strip(),
            explanation="AI code completion",
            confidence=0.9,
            language=language
        )

    async def refactor_code(
        self,
        code: str,
        language: str,
        refactoring_type: str = "general"
    ) -> CodeSuggestion:
        """Refactor code for better quality."""

        system_prompt = f"""You are an expert {language} developer specializing in code refactoring.
        Refactor the provided code to improve readability, performance, and maintainability.

        Return the refactored code only."""

        user_prompt = f"""
        Refactor this {language} code (type: {refactoring_type}):

        {code}

        Focus on:
        - Code readability
        - Performance improvements
        - Best practices
        - Maintainability
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        refactored = await self.ai_service._call_openai(messages, temperature=0.2)

        return CodeSuggestion(
            code=refactored.strip(),
            explanation=f"Refactored for better {refactoring_type}",
            confidence=0.8,
            language=language
        )

    async def explain_code(
        self,
        code: str,
        language: str,
        detail_level: str = "medium"
    ) -> str:
        """Explain what the code does."""

        system_prompt = f"""You are an expert {language} developer. Explain the provided code clearly and accurately.
        Adjust detail level based on the request: brief, medium, or detailed."""

        user_prompt = f"""
        Explain this {language} code with {detail_level} detail:

        {code}
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        explanation = await self.ai_service._call_openai(messages, temperature=0.1)
        return explanation.strip()

    async def detect_bugs(
        self,
        code: str,
        language: str
    ) -> List[Dict[str, Any]]:
        """Detect potential bugs in code."""

        system_prompt = f"""You are an expert {language} developer and debugger.
        Analyze the code for potential bugs, security issues, and logical errors.

        Return a JSON array of issues:
        [{{
            "type": "bug|security|logic|performance",
            "severity": "low|medium|high|critical",
            "description": "description of the issue",
            "line": 1,
            "suggestion": "how to fix it"
        }}]"""

        user_prompt = f"""
        Analyze this {language} code for bugs and issues:

        {code}
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self.ai_service._call_openai(messages, temperature=0.1)

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse bug detection response: {response}")
            return []

    def analyze_complexity(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code complexity metrics."""

        lines = code.split('\n')
        total_lines = len(lines)

        # Simple complexity analysis
        functions = len(re.findall(r'\bfunction\b|\bdef\b|\bclass\b', code))
        loops = len(re.findall(r'\bfor\b|\bwhile\b|\bforeach\b', code))
        conditionals = len(re.findall(r'\bif\b|\belif\b|\belse\b|\bswitch\b', code))

        complexity_score = min(100, (functions * 2 + loops * 3 + conditionals * 1.5))

        return {
            "total_lines": total_lines,
            "functions": functions,
            "loops": loops,
            "conditionals": conditionals,
            "complexity_score": complexity_score,
            "maintainability": "high" if complexity_score < 30 else "medium" if complexity_score < 60 else "low"
        }