"""Add user profile fields and fix email/phone_number architecture.

Revision ID: 001_add_profile_fields
Revises: (no previous migration — initial)
Create Date: 2026-09-18

Migration summary:
1. Add `email` column (populated from existing phone_number values, since
   phone_number was previously used to store email addresses).
2. Add all profile columns: first_name, last_name, riding_experience,
   riding_duration_months, current_bikes, previous_bikes, bike_preferences,
   intent, city, dream_bike, profile_completed.
3. Mark all existing users as profile_completed = true (they must NOT
   be forced through onboarding).
4. Make phone_number nullable and set existing values to NULL (since they
   contained emails, not real phone numbers).
"""

from alembic import op
import sqlalchemy as sa

revision: str = '001_add_profile_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Establish missing tables for a fresh deployment. Existing tables are not
    # modified by create_all; the operations below migrate the legacy users
    # table explicitly.
    bind = op.get_bind()
    from app.models.base import Base
    import app.models  # noqa: F401 — register all tables on Base.metadata

    Base.metadata.create_all(bind=bind)
    inspector = sa.inspect(bind)
    if not inspector.has_table('users'):
        return
    if 'email' in {column['name'] for column in inspector.get_columns('users')}:
        return

    # --- Step 1: Add the email column (nullable first for data migration) ---
    op.add_column('users', sa.Column('email', sa.String(), nullable=True))

    # --- Step 2: Copy email addresses from phone_number to email ---
    # (phone_number currently stores email addresses)
    op.execute("UPDATE users SET email = phone_number")

    # --- Step 3: Make email NOT NULL and add unique index ---
    # For SQLite, we set nullable via batch mode; for PG, use ALTER directly.
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('email', nullable=False)
        batch_op.create_index('ix_users_email', ['email'], unique=True)

    # --- Step 4: Add profile fields ---
    op.add_column('users', sa.Column('first_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('riding_experience', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('riding_duration_months', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('current_bikes', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('users', sa.Column('previous_bikes', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('users', sa.Column('bike_preferences', sa.JSON(), nullable=True, server_default='[]'))
    op.add_column('users', sa.Column('intent', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('dream_bike', sa.String(200), nullable=True))
    op.add_column('users', sa.Column(
        'profile_completed', sa.Boolean(), nullable=False, server_default='0'
    ))

    # --- Step 5: Mark ALL existing users as profile_completed = true ---
    op.execute("UPDATE users SET profile_completed = 1")

    # --- Step 6: Make phone_number nullable and clear old email values ---
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('phone_number', nullable=True)

    # Set phone_number to NULL for existing rows (they had email, not phone)
    op.execute("UPDATE users SET phone_number = NULL")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table('users'):
        return
    if 'email' not in {column['name'] for column in inspector.get_columns('users')}:
        return

    # Restore phone_number from email
    op.execute("UPDATE users SET phone_number = email WHERE phone_number IS NULL")

    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('phone_number', nullable=False)
        batch_op.drop_index('ix_users_email')

    op.drop_column('users', 'profile_completed')
    op.drop_column('users', 'dream_bike')
    op.drop_column('users', 'city')
    op.drop_column('users', 'intent')
    op.drop_column('users', 'bike_preferences')
    op.drop_column('users', 'previous_bikes')
    op.drop_column('users', 'current_bikes')
    op.drop_column('users', 'riding_duration_months')
    op.drop_column('users', 'riding_experience')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'email')
