"""add blog tables

Revision ID: 004_add_blog_tables
Revises: 003_store_listing_enum_values
Create Date: 2026-10-01

Creates blog_tags, blog_posts, blog_post_tags, and blog_reports tables.
Creates the native PostgreSQL enum type blog_post_status with values
'draft' and 'published'. SQLite uses a plain VARCHAR column since it
has no native enum support.
"""

import re

from alembic import op
import sqlalchemy as sa

revision = "004_add_blog_tables"
down_revision = "003_store_listing_enum_values"
branch_labels = None
depends_on = None


def _slugify(text: str) -> str:
    """Generate a URL-safe slug from a tag name."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def upgrade() -> None:
    bind = op.get_bind()
    is_postgresql = bind.dialect.name == "postgresql"

    # ── 1. Create native enum type for PostgreSQL ──────────────────────────
    if is_postgresql:
        op.execute(
            sa.text(
                "CREATE TYPE blog_post_status AS ENUM ('draft', 'published')"
            )
        )

    # Determine the column type for blog_posts.status based on dialect
    if is_postgresql:
        status_type = sa.Enum(
            "draft",
            "published",
            name="blog_post_status",
            native_enum=True,
            create_type=False,  # Type already created above
        )
    else:
        # SQLite has no native enum; use plain VARCHAR
        status_type = sa.String(length=20)

    # ── 2. blog_tags ────────────────────────────────────────────────────────
    op.create_table(
        "blog_tags",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("slug", sa.String(length=120), nullable=False, unique=True, index=True),
    )

    # ── 3. blog_posts ───────────────────────────────────────────────────────
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "author_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.JSON(), nullable=False),
        sa.Column("cover_image_key", sa.String(length=255), nullable=True),
        sa.Column(
            "status",
            status_type,
            nullable=False,
            server_default="draft",
            index=True,
        ),
        sa.Column("search_text", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── 4. blog_post_tags (M2M) ─────────────────────────────────────────────
    op.create_table(
        "blog_post_tags",
        sa.Column(
            "post_id",
            sa.Integer(),
            sa.ForeignKey("blog_posts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.ForeignKey("blog_tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    # ── 5. blog_reports ─────────────────────────────────────────────────────
    op.create_table(
        "blog_reports",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "post_id",
            sa.Integer(),
            sa.ForeignKey("blog_posts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "reporter_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("post_id", "reporter_id", name="uq_blog_report_user_post"),
    )

    # ── 6. Seed tags ────────────────────────────────────────────────────────
    seed_tags = [
        "Ride Route", "Ride Plan", "Bike Review", "Car Review",
        "Recommendation", "Advice", "Question", "Discussion",
        "Experience", "Guide", "How-To", "Buying Guide",
        "Maintenance", "Modifications", "Gear", "Event",
        "Motorcycle", "Car", "Scooter", "EV", "Classic",
        "Sports Bike", "Adventure", "Cruiser", "Touring",
        "Commuting", "Off-Road", "Track", "Long Ride",
        "Group Ride", "Solo Ride", "Beginner",
    ]

    if is_postgresql:
        for tag in seed_tags:
            op.execute(
                sa.text(
                    "INSERT INTO blog_tags (name, slug) "
                    "VALUES (:name, :slug) "
                    "ON CONFLICT (name) DO NOTHING"
                ).bindparams(name=tag, slug=_slugify(tag))
            )
    else:
        # SQLite
        for tag in seed_tags:
            op.execute(
                sa.text(
                    "INSERT OR IGNORE INTO blog_tags (name, slug) "
                    "VALUES (:name, :slug)"
                ).bindparams(name=tag, slug=_slugify(tag))
            )


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("blog_reports")
    op.drop_table("blog_post_tags")
    op.drop_table("blog_posts")
    op.drop_table("blog_tags")

    # Drop the native enum type for PostgreSQL after all tables are gone
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(sa.text("DROP TYPE IF EXISTS blog_post_status"))
