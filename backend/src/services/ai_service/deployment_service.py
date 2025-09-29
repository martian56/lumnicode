"""
Deployment service for automated deployment to various platforms.
"""
import asyncio
import json
import os
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import logging
import aiohttp

logger = logging.getLogger(__name__)


class DeploymentPlatform(Enum):
    """Supported deployment platforms."""
    VERCEL = "vercel"
    NETLIFY = "netlify"
    RAILWAY = "railway"
    HEROKU = "heroku"
    DIGITAL_OCEAN = "digital_ocean"
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"


class DeploymentStatus(Enum):
    """Deployment status."""
    PENDING = "pending"
    BUILDING = "building"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DeploymentService:
    """Service for automated deployment to various platforms."""

    def __init__(self):
        self.session = None
        self.platform_configs = {
            DeploymentPlatform.VERCEL: {
                "api_url": "https://api.vercel.com",
                "token_env": "VERCEL_TOKEN"
            },
            DeploymentPlatform.NETLIFY: {
                "api_url": "https://api.netlify.com/api/v1",
                "token_env": "NETLIFY_TOKEN"
            },
            DeploymentPlatform.RAILWAY: {
                "api_url": "https://backboard.railway.app/graphql/v2",
                "token_env": "RAILWAY_TOKEN"
            }
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def deploy_project(
        self,
        project_path: str,
        platform: DeploymentPlatform,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Deploy a project to the specified platform."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        try:
            if platform == DeploymentPlatform.VERCEL:
                return await self._deploy_to_vercel(project_path, config)
            elif platform == DeploymentPlatform.NETLIFY:
                return await self._deploy_to_netlify(project_path, config)
            elif platform == DeploymentPlatform.RAILWAY:
                return await self._deploy_to_railway(project_path, config)
            else:
                raise ValueError(f"Unsupported platform: {platform}")
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            return {
                "status": DeploymentStatus.FAILED.value,
                "error": str(e),
                "platform": platform.value
            }

    async def _deploy_to_vercel(
        self,
        project_path: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Deploy to Vercel."""

        token = os.getenv("VERCEL_TOKEN")
        if not token:
            raise ValueError("VERCEL_TOKEN environment variable not set")

        # Create deployment
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Prepare files for deployment
        files = await self._prepare_files_for_deployment(project_path)

        deploy_data = {
            "name": config.get("name", "lumni-project") if config else "lumni-project",
            "files": files,
            "projectSettings": {
                "framework": config.get("framework", "vite") if config else "vite",
                "buildCommand": config.get("build_command", "npm run build") if config else "npm run build",
                "outputDirectory": config.get("output_dir", "dist") if config else "dist"
            }
        }

        async with self.session.post(
            "https://api.vercel.com/v1/deployments",
            headers=headers,
            json=deploy_data
        ) as response:
            if response.status == 200:
                result = await response.json()
                return {
                    "status": DeploymentStatus.SUCCESS.value,
                    "platform": "vercel",
                    "url": result.get("url"),
                    "deployment_id": result.get("id"),
                    "build_logs": result.get("build", {}).get("logs", [])
                }
            else:
                error = await response.text()
                raise Exception(f"Vercel deployment failed: {error}")

    async def _deploy_to_netlify(
        self,
        project_path: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Deploy to Netlify."""

        token = os.getenv("NETLIFY_TOKEN")
        if not token:
            raise ValueError("NETLIFY_TOKEN environment variable not set")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Create site first
        site_data = {
            "name": config.get("name", "lumni-project") if config else "lumni-project"
        }

        async with self.session.post(
            "https://api.netlify.com/api/v1/sites",
            headers=headers,
            json=site_data
        ) as response:
            if response.status != 201:
                error = await response.text()
                raise Exception(f"Failed to create Netlify site: {error}")

            site = await response.json()
            site_id = site["id"]

        # Deploy files
        files = await self._prepare_files_for_deployment(project_path)

        deploy_data = {
            "files": files,
            "draft": False
        }

        async with self.session.post(
            f"https://api.netlify.com/api/v1/sites/{site_id}/deploys",
            headers=headers,
            json=deploy_data
        ) as response:
            if response.status == 200:
                result = await response.json()
                return {
                    "status": DeploymentStatus.SUCCESS.value,
                    "platform": "netlify",
                    "url": result.get("url"),
                    "site_id": site_id,
                    "deploy_id": result.get("id")
                }
            else:
                error = await response.text()
                raise Exception(f"Netlify deployment failed: {error}")

    async def _deploy_to_railway(
        self,
        project_path: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Deploy to Railway."""

        token = os.getenv("RAILWAY_TOKEN")
        if not token:
            raise ValueError("RAILWAY_TOKEN environment variable not set")

        # Railway uses GraphQL API
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Create project
        create_project_query = """
        mutation CreateProject($input: ProjectCreateInput!) {
            projectCreate(input: $input) {
                code
                message
                project {
                    id
                    name
                }
            }
        }
        """

        project_input = {
            "name": config.get("name", "lumni-project") if config else "lumni-project",
            "teamId": config.get("team_id") if config else None
        }

        async with self.session.post(
            "https://backboard.railway.app/graphql/v2",
            headers=headers,
            json={
                "query": create_project_query,
                "variables": {"input": project_input}
            }
        ) as response:
            if response.status != 200:
                error = await response.text()
                raise Exception(f"Failed to create Railway project: {error}")

            result = await response.json()
            if result.get("errors"):
                raise Exception(f"Railway API error: {result['errors']}")

            project_id = result["data"]["projectCreate"]["project"]["id"]

        return {
            "status": DeploymentStatus.SUCCESS.value,
            "platform": "railway",
            "project_id": project_id,
            "message": "Project created successfully. Manual deployment setup required."
        }

    async def _prepare_files_for_deployment(self, project_path: str) -> Dict[str, str]:
        """Prepare project files for deployment."""

        files = {}

        # Walk through project directory
        for root, dirs, filenames in os.walk(project_path):
            # Skip common directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', '.next']]

            for filename in filenames:
                filepath = os.path.join(root, filename)
                relative_path = os.path.relpath(filepath, project_path)

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Convert to base64 for API
                        import base64
                        files[relative_path] = base64.b64encode(content.encode()).decode()
                except (UnicodeDecodeError, OSError) as e:
                    logger.warning(f"Skipping file {filepath}: {e}")
                    continue

        return files

    async def get_deployment_status(
        self,
        platform: DeploymentPlatform,
        deployment_id: str
    ) -> Dict[str, Any]:
        """Get deployment status."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        try:
            if platform == DeploymentPlatform.VERCEL:
                return await self._get_vercel_status(deployment_id)
            elif platform == DeploymentPlatform.NETLIFY:
                return await self._get_netlify_status(deployment_id)
            else:
                return {"status": "unknown", "platform": platform.value}
        except Exception as e:
            logger.error(f"Failed to get deployment status: {e}")
            return {"status": "error", "error": str(e)}

    async def _get_vercel_status(self, deployment_id: str) -> Dict[str, Any]:
        """Get Vercel deployment status."""

        token = os.getenv("VERCEL_TOKEN")
        headers = {"Authorization": f"Bearer {token}"}

        async with self.session.get(
            f"https://api.vercel.com/v1/deployments/{deployment_id}",
            headers=headers
        ) as response:
            if response.status == 200:
                result = await response.json()
                return {
                    "status": result.get("status", "unknown"),
                    "url": result.get("url"),
                    "build_logs": result.get("build", {}).get("logs", [])
                }
            else:
                return {"status": "error"}

    async def _get_netlify_status(self, deploy_id: str) -> Dict[str, Any]:
        """Get Netlify deployment status."""

        token = os.getenv("NETLIFY_TOKEN")
        headers = {"Authorization": f"Bearer {token}"}

        async with self.session.get(
            f"https://api.netlify.com/api/v1/deploys/{deploy_id}",
            headers=headers
        ) as response:
            if response.status == 200:
                result = await response.json()
                return {
                    "status": result.get("state", "unknown"),
                    "url": result.get("url")
                }
            else:
                return {"status": "error"}

    def get_supported_platforms(self) -> List[str]:
        """Get list of supported deployment platforms."""
        return [platform.value for platform in DeploymentPlatform]

    def get_platform_config(self, platform: DeploymentPlatform) -> Dict[str, str]:
        """Get configuration for a platform."""
        return self.platform_configs.get(platform, {})