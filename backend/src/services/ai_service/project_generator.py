"""
Project generation service using AI.
"""
import json
from typing import Dict, List, Optional, Any, TYPE_CHECKING
from .models import ProjectType, GeneratedProject
import logging

if TYPE_CHECKING:
    from . import AIService

logger = logging.getLogger(__name__)


class ProjectGenerator:
    """AI-powered project generation service."""

    def __init__(self, ai_service: "AIService"):
        self.ai_service = ai_service

    async def generate_from_description(
        self,
        description: str,
        project_type: ProjectType = ProjectType.WEB_APP,
        tech_stack: Optional[List[str]] = None,
        features: Optional[List[str]] = None
    ) -> GeneratedProject:
        """Generate a complete project from natural language description."""

        system_prompt = """You are an expert full-stack developer specializing in creating production-ready applications.
        Generate complete, modern, and scalable projects with best practices.

        Return a JSON object with this exact structure:
        {
            "name": "project-name-in-kebab-case",
            "description": "brief project description",
            "files": {
                "package.json": "content",
                "src/index.js": "content",
                "README.md": "content"
            },
            "dependencies": {
                "react": "^18.0.0",
                "express": "^4.18.0"
            },
            "dev_dependencies": {
                "nodemon": "^3.0.0"
            },
            "scripts": {
                "start": "node src/index.js",
                "dev": "nodemon src/index.js"
            },
            "deployment_config": {
                "vercel": {"framework": "next"},
                "netlify": {"build_command": "npm run build"}
            }
        }

        Ensure all files are complete and runnable. Include proper error handling, security, and best practices."""

        user_prompt = f"""
        Create a complete {project_type.value.replace('_', ' ')} project.

        Description: {description}

        Requirements:
        - Tech Stack: {', '.join(tech_stack) if tech_stack else 'Modern, scalable technologies'}
        - Features: {', '.join(features) if features else 'Essential features for the project type'}
        - Production-ready with proper structure
        - Include all necessary configuration files
        - Add comprehensive README with setup instructions
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self.ai_service._call_openai(messages, temperature=0.2)

        try:
            project_data = json.loads(response)

            # Ensure required fields exist
            project_data.setdefault("dev_dependencies", {})
            project_data.setdefault("deployment_config", {})

            return GeneratedProject(**project_data)
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse AI response: {e}")
            logger.error(f"Response: {response}")

            # Fallback project structure
            return self._create_fallback_project(description, project_type)

    def _create_fallback_project(self, description: str, project_type: ProjectType) -> GeneratedProject:
        """Create a basic fallback project structure."""

        name = description.lower().replace(" ", "-").replace(",", "").replace(".", "")[:30]

        if project_type == ProjectType.WEB_APP:
            return GeneratedProject(
                name=name,
                description=description,
                files={
                    "package.json": json.dumps({
                        "name": name,
                        "version": "1.0.0",
                        "description": description,
                        "scripts": {
                            "start": "node server.js",
                            "dev": "nodemon server.js"
                        }
                    }, indent=2),
                    "server.js": """
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
                    """,
                    "public/index.html": f"""
<!DOCTYPE html>
<html>
<head>
    <title>{description}</title>
    <style>
        body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
        h1 {{ color: #333; }}
    </style>
</head>
<body>
    <h1>{description}</h1>
    <p>Welcome to your new project!</p>
</body>
</html>
                    """,
                    "README.md": f"""
# {description}

A web application created with Lumnicode AI.

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open http://localhost:3000

## Features

- Basic Express server
- Static file serving
- Ready for development
                    """
                },
                dependencies={
                    "express": "^4.18.0"
                },
                scripts={
                    "start": "node server.js",
                    "dev": "nodemon server.js"
                }
            )

        # Default fallback
        return GeneratedProject(
            name=name,
            description=description,
            files={
                "README.md": f"# {description}\n\nGenerated project placeholder."
            },
            dependencies={},
            scripts={}
        )

    async def enhance_project(
        self,
        existing_files: Dict[str, str],
        enhancement_request: str
    ) -> Dict[str, str]:
        """Enhance existing project with new features."""

        system_prompt = """You are an expert developer. Enhance the existing project by adding the requested features.
        Return only the new or modified files as a JSON object: {"filename": "content"}"""

        files_context = "\n".join([f"{path}:\n{content[:500]}..." for path, content in existing_files.items()])

        user_prompt = f"""
        Existing project files:
        {files_context}

        Enhancement request: {enhancement_request}

        Add the requested features while maintaining code quality and best practices.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self.ai_service._call_openai(messages, temperature=0.3)

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse enhancement response: {response}")
            return {}