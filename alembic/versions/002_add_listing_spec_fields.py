"""Add extended motorcycle specification fields to listings.

Revision ID: 002_add_listing_spec_fields
Revises: 001_add_profile_fields
Create Date: 2026-09-18
"""

from alembic import op
import sqlalchemy as sa


revision = "002_add_listing_spec_fields"
down_revision = "001_add_profile_fields"
branch_labels = None
depends_on = None


_COLUMNS = (
    ("reg_number", sa.String(20)),
    ("rto_state", sa.String(100)),
    ("ownership_count", sa.Integer()),
    ("displacement_cc", sa.Integer()),
    ("torque_nm", sa.Float()),
    ("transmission", sa.String(100)),
    ("seat_height_mm", sa.Integer()),
    ("weight_kg", sa.Integer()),
    ("exhaust_type", sa.String(255)),
    ("tyre_condition_pct", sa.Integer()),
    ("tyre_dot_year", sa.Integer()),
    ("chain_sprocket_health", sa.String(255)),
    ("keys_count", sa.Integer()),
    ("service_history_type", sa.String(255)),
    ("insurance_type", sa.String(255)),
    ("insurance_valid_until", sa.String(50)),
    ("hypothecation_status", sa.String(255)),
    ("modifications", sa.JSON()),
    ("flaws", sa.JSON()),
    ("equipment", sa.JSON()),
    ("editorial_review", sa.Text()),
    ("media_gallery", sa.JSON()),
    ("description", sa.Text()),
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("listings"):
        return

    existing = {column["name"] for column in inspector.get_columns("listings")}
    for name, column_type in _COLUMNS:
        if name not in existing:
            op.add_column("listings", sa.Column(name, column_type, nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("listings"):
        return

    existing = {column["name"] for column in inspector.get_columns("listings")}
    for name, _ in reversed(_COLUMNS):
        if name in existing:
            op.drop_column("listings", name)
