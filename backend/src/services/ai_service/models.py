"""
Shared models for AI service.
"""
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum


class AIModel(Enum):
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    CLAUDE_3_OPUS = "claude-3-opus"
    CLAUDE_3_SONNET = "claude-3-sonnet"


class ProjectType(Enum):
    WEB_APP = "web_app"
    API = "api"
    MOBILE_APP = "mobile_app"
    DESKTOP_APP = "desktop_app"
    LIBRARY = "library"
    CLI_TOOL = "cli_tool"


@dataclass
class CodeSuggestion:
    code: str
    explanation: str
    confidence: float
    language: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None


@dataclass
class ProjectTemplate:
    name: str
    description: str
    type: ProjectType
    tech_stack: List[str]
    features: List[str]
    complexity: str  # "simple", "medium", "complex"


@dataclass
class GeneratedProject:
    name: str
    description: str
    files: Dict[str, str]  # filename -> content
    dependencies: Dict[str, str]  # package -> version
    scripts: Dict[str, str]  # script_name -> command
    deployment_config: Optional[Dict[str, Any]] = None