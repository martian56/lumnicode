import asyncio
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

from src.services.multi_provider_ai_service import MultiProviderAIService
from src.api.websocket import send_progress_update, create_ai_session, get_ai_session, update_ai_session
from src.models.models import Project, File
from src.db.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AIGenerationService:
    def __init__(self):
        self.ai_service = MultiProviderAIService()
        self.active_generations: Dict[str, asyncio.Task] = {}

    async def start_generation(
        self, 
        project_id: str, 
        user_id: str, 
        prompt: str, 
        tech_stack: List[str],
        db: Session
    ) -> str:
        """Start AI generation for a project"""
        
        # Create AI session
        session_id = create_ai_session(project_id, user_id, prompt, tech_stack)
        
        # Start generation task
        task = asyncio.create_task(
            self._generate_project(session_id, project_id, user_id, prompt, tech_stack, db)
        )
        self.active_generations[session_id] = task
        
        # Send initial progress
        await send_progress_update(
            session_id, 
            "progress", 
            "Starting AI generation...", 
            0
        )
        
        return session_id

    async def _generate_project(
        self, 
        session_id: str, 
        project_id: str, 
        user_id: str,
        prompt: str, 
        tech_stack: List[str],
        db: Session
    ):
        """Generate project files using AI"""
        
        try:
            # Get project from database
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                await send_progress_update(session_id, "error", "Project not found")
                return

            # Update session status
            update_ai_session(session_id, status="running", progress=10)
            
            # Step 1: Analyze requirements and plan structure
            await send_progress_update(
                session_id, 
                "progress", 
                "Analyzing requirements and planning project structure...", 
                10
            )
            
            structure_prompt = f"""
            Based on this prompt: "{prompt}"
            And tech stack: {', '.join(tech_stack)}
            
            Create a detailed project structure with:
            1. File organization
            2. Dependencies needed
            3. Key components/modules
            4. Configuration files
            
            Return as JSON with this structure:
            {{
                "structure": [
                    {{"path": "src/components/App.tsx", "type": "component", "description": "..."}},
                    {{"path": "package.json", "type": "config", "description": "..."}}
                ],
                "dependencies": ["react", "typescript", ...],
                "description": "Project overview"
            }}
            """
            
            structure_response = await self.ai_service.generate_text(
                prompt=structure_prompt,
                user_id=int(user_id) if user_id.isdigit() else hash(user_id) % (2**31),  # Convert to int safely
                max_tokens=2000
            )
            
            if not structure_response:
                await send_progress_update(session_id, "error", "Failed to generate project structure")
                return
            
            # Parse structure
            try:
                structure_data = json.loads(structure_response)
                files_to_create = structure_data.get("structure", [])
                dependencies = structure_data.get("dependencies", [])
            except json.JSONDecodeError:
                await send_progress_update(session_id, "error", "Failed to parse project structure")
                return
            
            update_ai_session(session_id, progress=20, context={"structure": structure_data})
            
            # Step 2: Create package.json and configuration files
            await send_progress_update(
                session_id, 
                "progress", 
                "Creating configuration files...", 
                20
            )
            
            # Create package.json
            package_json_content = await self._generate_package_json(tech_stack, dependencies, prompt)
            await self._create_file(db, project_id, "package.json", package_json_content, session_id)
            
            # Create other config files based on tech stack
            config_files = await self._generate_config_files(tech_stack, prompt)
            for file_path, content in config_files.items():
                await self._create_file(db, project_id, file_path, content, session_id)
            
            update_ai_session(session_id, progress=30)
            
            # Step 3: Generate main application files
            await send_progress_update(
                session_id, 
                "progress", 
                "Generating main application files...", 
                30
            )
            
            total_files = len(files_to_create)
            completed_files = 0
            
            for file_info in files_to_create:
                # Check if generation was stopped
                session = get_ai_session(session_id)
                if not session or session.get("status") != "running":
                    await send_progress_update(session_id, "stopped", "Generation stopped by user")
                    return
                
                file_path = file_info["path"]
                file_type = file_info.get("type", "component")
                description = file_info.get("description", "")
                
                # Generate file content
                file_content = await self._generate_file_content(
                    file_path, file_type, description, prompt, tech_stack, session_id
                )
                
                if file_content:
                    await self._create_file(db, project_id, file_path, file_content, session_id)
                    completed_files += 1
                    
                    # Update progress
                    progress = 30 + (completed_files / total_files) * 60
                    await send_progress_update(
                        session_id, 
                        "file_created", 
                        f"Created {file_path}", 
                        int(progress),
                        current_file=file_path,
                        total_files=total_files,
                        completed_files=completed_files
                    )
                    
                    # Small delay to show progress
                    await asyncio.sleep(0.5)
            
            # Step 4: Finalize project
            await send_progress_update(
                session_id, 
                "progress", 
                "Finalizing project...", 
                90
            )
            
            # Update project description
            project.description = structure_data.get("description", prompt)
            db.commit()
            
            # Complete generation
            update_ai_session(session_id, status="completed", progress=100)
            await send_progress_update(
                session_id, 
                "completed", 
                "Project generation completed successfully!", 
                100
            )
            
            logger.info(f"AI generation completed for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error in AI generation: {e}")
            await send_progress_update(session_id, "error", f"Generation failed: {str(e)}")
            update_ai_session(session_id, status="error")
        
        finally:
            # Clean up
            if session_id in self.active_generations:
                del self.active_generations[session_id]

    async def _generate_package_json(self, tech_stack: List[str], dependencies: List[str], prompt: str) -> str:
        """Generate package.json content"""
        
        package_json_prompt = f"""
        Create a package.json file for a project with:
        - Tech stack: {', '.join(tech_stack)}
        - Dependencies: {', '.join(dependencies)}
        - Description: {prompt}
        
        Include appropriate scripts, devDependencies, and configuration.
        Return only valid JSON.
        """
        
        response = await self.ai_service.generate_text(
            prompt=package_json_prompt,
            user_id=int(user_id) if user_id.isdigit() else hash(user_id) % (2**31),
            max_tokens=1000
        )
        
        if response:
            try:
                # Validate JSON
                json.loads(response)
                return response
            except json.JSONDecodeError:
                pass
        
        # Fallback package.json
        return json.dumps({
            "name": "ai-generated-project",
            "version": "1.0.0",
            "description": prompt,
            "main": "index.js",
            "scripts": {
                "dev": "vite",
                "build": "vite build",
                "preview": "vite preview"
            },
            "dependencies": dependencies,
            "devDependencies": {
                "vite": "^4.0.0",
                "@types/node": "^18.0.0"
            }
        }, indent=2)

    async def _generate_config_files(self, tech_stack: List[str], prompt: str) -> Dict[str, str]:
        """Generate configuration files based on tech stack"""
        config_files = {}
        
        if "react" in tech_stack or "vue" in tech_stack:
            # Generate Vite config
            vite_config = await self.ai_service.generate_text(
                prompt=f"Create a vite.config.ts file for a {prompt} project with {', '.join(tech_stack)}",
                user_id=int(user_id) if user_id.isdigit() else hash(user_id) % (2**31),
                max_tokens=500
            )
            if vite_config:
                config_files["vite.config.ts"] = vite_config
        
        if "typescript" in tech_stack:
            # Generate tsconfig.json
            tsconfig = await self.ai_service.generate_text(
                prompt=f"Create a tsconfig.json file for a {prompt} project",
                user_id=int(user_id) if user_id.isdigit() else hash(user_id) % (2**31),
                max_tokens=300
            )
            if tsconfig:
                config_files["tsconfig.json"] = tsconfig
        
        return config_files

    async def _generate_file_content(
        self, 
        file_path: str, 
        file_type: str, 
        description: str, 
        prompt: str, 
        tech_stack: List[str],
        session_id: str
    ) -> Optional[str]:
        """Generate content for a specific file"""
        
        file_prompt = f"""
        Create a {file_type} file at {file_path} for a project with:
        - Description: {prompt}
        - Tech stack: {', '.join(tech_stack)}
        - File purpose: {description}
        
        Make it production-ready with proper imports, error handling, and best practices.
        Return only the file content, no explanations.
        """
        
        try:
            response = await self.ai_service.generate_text(
                prompt=file_prompt,
                user_id=int(user_id) if user_id.isdigit() else hash(user_id) % (2**31),
                max_tokens=2000
            )
            return response
        except Exception as e:
            logger.error(f"Error generating file content for {file_path}: {e}")
            return None

    async def _create_file(self, db: Session, project_id: str, file_path: str, content: str, session_id: str):
        """Create a file in the database"""
        try:
            # Check if file already exists
            existing_file = db.query(File).filter(
                File.project_id == project_id,
                File.path == file_path
            ).first()
            
            if existing_file:
                # Update existing file
                existing_file.content = content
                existing_file.updated_at = datetime.utcnow()
            else:
                # Create new file
                new_file = File(
                    id=str(uuid.uuid4()),
                    project_id=project_id,
                    name=file_path.split('/')[-1],  # Extract filename from path
                    path=file_path,
                    content=content,
                    language=self._get_language_from_path(file_path)
                )
                db.add(new_file)
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error creating file {file_path}: {e}")
            db.rollback()

    def _get_language_from_path(self, file_path: str) -> str:
        """Determine language from file path"""
        extension = file_path.split('.')[-1].lower()
        language_map = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'md': 'markdown',
            'sql': 'sql',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust'
        }
        return language_map.get(extension, 'text')

    def _get_file_type(self, file_path: str) -> str:
        """Determine file type from path"""
        if file_path.endswith('.tsx') or file_path.endswith('.jsx'):
            return 'component'
        elif file_path.endswith('.ts') or file_path.endswith('.js'):
            return 'script'
        elif file_path.endswith('.css') or file_path.endswith('.scss'):
            return 'style'
        elif file_path.endswith('.json'):
            return 'config'
        elif file_path.endswith('.md'):
            return 'documentation'
        else:
            return 'other'

    async def stop_generation(self, session_id: str):
        """Stop AI generation"""
        if session_id in self.active_generations:
            self.active_generations[session_id].cancel()
            del self.active_generations[session_id]
        
        update_ai_session(session_id, status="stopped")

    async def pause_generation(self, session_id: str):
        """Pause AI generation"""
        update_ai_session(session_id, status="paused")

    async def resume_generation(self, session_id: str):
        """Resume AI generation"""
        session = get_ai_session(session_id)
        if session and session.get("status") == "paused":
            update_ai_session(session_id, status="running")
            # Restart generation from where it left off
            # This would require more complex state management

# Singleton instance
ai_generation_service = AIGenerationService()
