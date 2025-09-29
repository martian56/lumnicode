"""
GitHub integration service for repository management and operations.
"""
import asyncio
import json
import os
from typing import Dict, List, Optional, Any, Tuple
import logging
import aiohttp
from datetime import datetime

logger = logging.getLogger(__name__)


class GitHubService:
    """Service for GitHub repository operations."""

    def __init__(self):
        self.session = None
        self.base_url = "https://api.github.com"
        self.token = os.getenv("GITHUB_TOKEN")

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for GitHub API requests."""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "LumniCode/1.0"
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers

    async def create_repository(
        self,
        name: str,
        description: str = "",
        private: bool = False,
        auto_init: bool = True
    ) -> Dict[str, Any]:
        """Create a new GitHub repository."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")

        data = {
            "name": name,
            "description": description,
            "private": private,
            "auto_init": auto_init
        }

        async with self.session.post(
            f"{self.base_url}/user/repos",
            headers=self._get_headers(),
            json=data
        ) as response:
            if response.status == 201:
                repo = await response.json()
                return {
                    "success": True,
                    "repo": {
                        "id": repo["id"],
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "html_url": repo["html_url"],
                        "ssh_url": repo["ssh_url"],
                        "clone_url": repo["clone_url"]
                    }
                }
            else:
                error = await response.text()
                raise Exception(f"Failed to create repository: {error}")

    async def get_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        """Get repository information."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        async with self.session.get(
            f"{self.base_url}/repos/{owner}/{repo}",
            headers=self._get_headers()
        ) as response:
            if response.status == 200:
                repo_data = await response.json()
                return {
                    "success": True,
                    "repo": {
                        "id": repo_data["id"],
                        "name": repo_data["name"],
                        "full_name": repo_data["full_name"],
                        "description": repo_data["description"],
                        "html_url": repo_data["html_url"],
                        "private": repo_data["private"],
                        "forks_count": repo_data["forks_count"],
                        "stargazers_count": repo_data["stargazers_count"],
                        "language": repo_data["language"]
                    }
                }
            else:
                error = await response.text()
                return {"success": False, "error": error}

    async def create_commit(
        self,
        owner: str,
        repo: str,
        files: Dict[str, str],
        message: str,
        branch: str = "main"
    ) -> Dict[str, Any]:
        """Create a commit with multiple files."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")

        try:
            # Get the latest commit SHA
            ref_response = await self.session.get(
                f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{branch}",
                headers=self._get_headers()
            )

            if ref_response.status != 200:
                # Try to create the branch if it doesn't exist
                await self._create_branch(owner, repo, branch)
                ref_response = await self.session.get(
                    f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{branch}",
                    headers=self._get_headers()
                )

            ref_data = await ref_response.json()
            latest_commit_sha = ref_data["object"]["sha"]

            # Get the commit data
            commit_response = await self.session.get(
                f"{self.base_url}/repos/{owner}/{repo}/git/commits/{latest_commit_sha}",
                headers=self._get_headers()
            )
            commit_data = await commit_response.json()
            tree_sha = commit_data["tree"]["sha"]

            # Create blobs for each file
            blobs = []
            for file_path, content in files.items():
                blob_data = {
                    "content": content,
                    "encoding": "utf-8"
                }

                blob_response = await self.session.post(
                    f"{self.base_url}/repos/{owner}/{repo}/git/blobs",
                    headers=self._get_headers(),
                    json=blob_data
                )
                blob_result = await blob_response.json()
                blobs.append({
                    "path": file_path,
                    "mode": "100644",
                    "type": "blob",
                    "sha": blob_result["sha"]
                })

            # Create a new tree
            tree_data = {
                "base_tree": tree_sha,
                "tree": blobs
            }

            tree_response = await self.session.post(
                f"{self.base_url}/repos/{owner}/{repo}/git/trees",
                headers=self._get_headers(),
                json=tree_data
            )
            tree_result = await tree_response.json()
            new_tree_sha = tree_result["sha"]

            # Create a new commit
            commit_data = {
                "message": message,
                "tree": new_tree_sha,
                "parents": [latest_commit_sha]
            }

            commit_response = await self.session.post(
                f"{self.base_url}/repos/{owner}/{repo}/git/commits",
                headers=self._get_headers(),
                json=commit_data
            )
            commit_result = await commit_response.json()
            new_commit_sha = commit_result["sha"]

            # Update the reference
            ref_data = {
                "sha": new_commit_sha,
                "force": False
            }

            ref_response = await self.session.patch(
                f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{branch}",
                headers=self._get_headers(),
                json=ref_data
            )

            if ref_response.status == 200:
                return {
                    "success": True,
                    "commit_sha": new_commit_sha,
                    "branch": branch,
                    "files_count": len(files)
                }
            else:
                error = await ref_response.text()
                raise Exception(f"Failed to update reference: {error}")

        except Exception as e:
            logger.error(f"Failed to create commit: {e}")
            return {"success": False, "error": str(e)}

    async def _create_branch(self, owner: str, repo: str, branch: str) -> None:
        """Create a new branch."""

        # Get the default branch SHA
        default_ref_response = await self.session.get(
            f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/main",
            headers=self._get_headers()
        )

        if default_ref_response.status != 200:
            # Try master instead
            default_ref_response = await self.session.get(
                f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/master",
                headers=self._get_headers()
            )

        if default_ref_response.status != 200:
            raise Exception("Could not find default branch")

        default_ref_data = await default_ref_response.json()
        sha = default_ref_data["object"]["sha"]

        # Create new branch
        ref_data = {
            "ref": f"refs/heads/{branch}",
            "sha": sha
        }

        ref_response = await self.session.post(
            f"{self.base_url}/repos/{owner}/{repo}/git/refs",
            headers=self._get_headers(),
            json=ref_data
        )

        if ref_response.status != 201:
            error = await ref_response.text()
            raise Exception(f"Failed to create branch: {error}")

    async def get_user_repositories(self, username: str) -> List[Dict[str, Any]]:
        """Get user's repositories."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        repos = []
        page = 1

        while True:
            async with self.session.get(
                f"{self.base_url}/users/{username}/repos?page={page}&per_page=100",
                headers=self._get_headers()
            ) as response:
                if response.status != 200:
                    break

                page_repos = await response.json()
                if not page_repos:
                    break

                for repo in page_repos:
                    repos.append({
                        "id": repo["id"],
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "description": repo["description"],
                        "html_url": repo["html_url"],
                        "private": repo["private"],
                        "forks_count": repo["forks_count"],
                        "stargazers_count": repo["stargazers_count"],
                        "language": repo["language"],
                        "updated_at": repo["updated_at"]
                    })

                page += 1
                if len(page_repos) < 100:
                    break

        return repos

    async def fork_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        """Fork a repository."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")

        async with self.session.post(
            f"{self.base_url}/repos/{owner}/{repo}/forks",
            headers=self._get_headers()
        ) as response:
            if response.status == 202:
                forked_repo = await response.json()
                return {
                    "success": True,
                    "repo": {
                        "id": forked_repo["id"],
                        "name": forked_repo["name"],
                        "full_name": forked_repo["full_name"],
                        "html_url": forked_repo["html_url"]
                    }
                }
            else:
                error = await response.text()
                return {"success": False, "error": error}

    async def create_pull_request(
        self,
        owner: str,
        repo: str,
        title: str,
        head: str,
        base: str = "main",
        body: str = ""
    ) -> Dict[str, Any]:
        """Create a pull request."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")

        data = {
            "title": title,
            "head": head,
            "base": base,
            "body": body
        }

        async with self.session.post(
            f"{self.base_url}/repos/{owner}/{repo}/pulls",
            headers=self._get_headers(),
            json=data
        ) as response:
            if response.status == 201:
                pr = await response.json()
                return {
                    "success": True,
                    "pr": {
                        "id": pr["id"],
                        "number": pr["number"],
                        "title": pr["title"],
                        "html_url": pr["html_url"],
                        "state": pr["state"]
                    }
                }
            else:
                error = await response.text()
                return {"success": False, "error": error}

    async def get_repository_contents(
        self,
        owner: str,
        repo: str,
        path: str = "",
        branch: str = "main"
    ) -> List[Dict[str, Any]]:
        """Get repository contents."""

        if not self.session:
            self.session = aiohttp.ClientSession()

        async with self.session.get(
            f"{self.base_url}/repos/{owner}/{repo}/contents/{path}?ref={branch}",
            headers=self._get_headers()
        ) as response:
            if response.status == 200:
                contents = await response.json()
                if isinstance(contents, list):
                    return [{
                        "name": item["name"],
                        "path": item["path"],
                        "type": item["type"],
                        "size": item.get("size", 0),
                        "download_url": item.get("download_url")
                    } for item in contents]
                else:
                    return [{
                        "name": contents["name"],
                        "path": contents["path"],
                        "type": contents["type"],
                        "size": contents.get("size", 0),
                        "content": contents.get("content"),
                        "encoding": contents.get("encoding")
                    }]
            else:
                return []