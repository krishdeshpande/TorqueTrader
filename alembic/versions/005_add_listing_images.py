"""Add the listing images JSON column.

Revision ID: 005_add_listing_images
Revises: 004_add_blog_tables
Create Date: 2026-10-13

The images attribute was introduced on the Listing ORM model but was not
included in the original listing-spec migration.  Existing production tables
therefore need this additive, data-safe migration.
"""

from alembic import op
import sqlalchemy as sa


revision = "005_add_listing_images"
down_revision = "004_add_blog_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("listings"):
        return

    columns = {column["name"] for column in inspector.get_columns("listings")}
    if "images" not in columns:
        op.add_column("listings", sa.Column("images", sa.JSON(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("listings"):
        return

    columns = {column["name"] for column in inspector.get_columns("listings")}
    if "images" in columns:
        op.drop_column("listings", "images")
