"""Initial migration with UUID4 support

Revision ID: 328cb9de3afa
Revises:
Create Date: 2025-09-25 09:53:45.353618

"""
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = '328cb9de3afa'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add UUID columns to projects table
    op.add_column('projects', sa.Column('id_uuid', UUID(as_uuid=True), default=uuid.uuid4, nullable=True))

    # Add UUID columns to files table
    op.add_column('files', sa.Column('id_uuid', UUID(as_uuid=True), default=uuid.uuid4, nullable=True))
    op.add_column('files', sa.Column('project_id_uuid', UUID(as_uuid=True), nullable=True))

    # Generate UUIDs for existing projects
    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE projects SET id_uuid = uuid_generate_v4() WHERE id_uuid IS NULL
    """))

    # Generate UUIDs for existing files and update project references
    connection.execute(sa.text("""
        UPDATE files SET
            id_uuid = uuid_generate_v4(),
            project_id_uuid = projects.id_uuid
        FROM projects
        WHERE files.project_id = projects.id AND files.id_uuid IS NULL
    """))

    # Make UUID columns not nullable
    op.alter_column('projects', 'id_uuid', nullable=False)
    op.alter_column('files', 'id_uuid', nullable=False)
    op.alter_column('files', 'project_id_uuid', nullable=False)

    # Drop old foreign key constraints
    op.drop_constraint('files_project_id_fkey', 'files', type_='foreignkey')

    # Drop old primary key constraints
    op.drop_constraint('projects_pkey', 'projects', type_='primary')
    op.drop_constraint('files_pkey', 'files', type_='primary')

    # Drop old integer columns
    op.drop_column('projects', 'id')
    op.drop_column('files', 'id')
    op.drop_column('files', 'project_id')

    # Rename UUID columns to replace old ones
    op.alter_column('projects', 'id_uuid', new_column_name='id')
    op.alter_column('files', 'id_uuid', new_column_name='id')
    op.alter_column('files', 'project_id_uuid', new_column_name='project_id')

    # Add new primary key constraints
    op.create_primary_key('projects_pkey', 'projects', ['id'])
    op.create_primary_key('files_pkey', 'files', ['id'])

    # Add new foreign key constraint
    op.create_foreign_key('files_project_id_fkey', 'files', 'projects', ['project_id'], ['id'])

    # Add indexes for performance
    op.create_index('ix_projects_id', 'projects', ['id'])
    op.create_index('ix_files_id', 'files', ['id'])
    op.create_index('ix_files_project_id', 'files', ['project_id'])


def downgrade() -> None:
    # This is a destructive migration - we can't reliably convert back to integers
    # In a production environment, you'd want to store the old IDs somewhere
    raise Exception("Cannot downgrade UUID4 migration - data would be lost")