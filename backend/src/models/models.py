"""
Database models for Lumnicode.
"""

import uuid
import enum
from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    ForeignKey, Boolean, Enum, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.db.database import Base


# --------------------------
# ENUMS
# --------------------------

class ProviderEnum(str, enum.Enum):
    OPENAI = "openai"
    GOOGLE = "google"
    HUGGINGFACE = "huggingface"
    TOGETHER = "together"
    FIREWORKS = "fireworks"
    OTHER = "other"


class RoleEnum(str, enum.Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"


# --------------------------
# USER
# --------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    api_keys = relationship("UserAPIKey", back_populates="user", cascade="all, delete-orphan")
    memberships = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")


# --------------------------
# USER API KEYS
# --------------------------

class UserAPIKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(Enum(ProviderEnum), nullable=False)
    api_key = Column(Text, nullable=False)  # store encrypted in production
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="api_keys")

    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uq_user_provider"),
    )


# --------------------------
# PROJECT
# --------------------------

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_opened_at = Column(DateTime(timezone=True))

    # Relationships
    owner = relationship("User", back_populates="projects")
    files = relationship("File", back_populates="project", cascade="all, delete-orphan")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    snapshots = relationship("ProjectSnapshot", back_populates="project", cascade="all, delete-orphan")


# --------------------------
# PROJECT MEMBERSHIP
# --------------------------

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.EDITOR, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_user"),
    )


# --------------------------
# FILE
# --------------------------

class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)  # full path within project
    content = Column(Text, default="")
    language = Column(String(50), default="text")
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="files")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("project_id", "path", name="uq_project_file_path"),
    )


# --------------------------
# FILE VERSIONING
# --------------------------

class FileVersion(Base):
    __tablename__ = "file_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)  # auto-increment per file
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    file = relationship("File", back_populates="versions")
    author = relationship("User")

    __table_args__ = (
        UniqueConstraint("file_id", "version_number", name="uq_file_version"),
    )


# --------------------------
# PROJECT SNAPSHOTS
# --------------------------

class ProjectSnapshot(Base):
    __tablename__ = "project_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    description = Column(Text)  # e.g. "Before refactor"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    project = relationship("Project", back_populates="snapshots")
    author = relationship("User")
    files = relationship("SnapshotFile", back_populates="snapshot", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("project_id", "version_number", name="uq_project_version"),
    )


class SnapshotFile(Base):
    __tablename__ = "snapshot_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    snapshot_id = Column(UUID(as_uuid=True), ForeignKey("project_snapshots.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    language = Column(String(50), default="text")

    # Relationships
    snapshot = relationship("ProjectSnapshot", back_populates="files")

    __table_args__ = (
        UniqueConstraint("snapshot_id", "file_path", name="uq_snapshot_file"),
    )

# -------------------------
# Usage Logs
# -------------------------
class UsageLog(Base):
    """
    Logs every AI request made by a user.
    Useful for showing usage history, debugging, and billing.
    """
    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(Enum(ProviderEnum), nullable=False)  # safer enum
    model = Column(String(255), nullable=False)  # e.g., "gpt-4", "claude-3-opus"
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    tokens_used = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="usage_logs")