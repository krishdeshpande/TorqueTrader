"""
Seed the default TorqueTrader blog tags.

This module ensures that blog tags exist even when the database was
initialized using SQLAlchemy's create_all() instead of Alembic migrations.

Existing tags are preserved. Missing tags are inserted.
"""

import logging
import re

from sqlalchemy.orm import Session

from app.models.blog import BlogTag

logger = logging.getLogger(__name__)


DEFAULT_BLOG_TAGS = [
    "Ride Route",
    "Ride Plan",
    "Bike Review",
    "Car Review",
    "Recommendation",
    "Advice",
    "Question",
    "Discussion",
    "Experience",
    "Guide",
    "How-To",
    "Buying Guide",
    "Maintenance",
    "Modifications",
    "Gear",
    "Event",
    "Motorcycle",
    "Car",
    "Scooter",
    "EV",
    "Classic",
    "Sports Bike",
    "Adventure",
    "Cruiser",
    "Touring",
    "Commuting",
    "Off-Road",
    "Track",
    "Long Ride",
    "Group Ride",
    "Solo Ride",
    "Beginner",
]


def slugify_tag(name: str) -> str:
    """Convert a tag name into a URL-friendly slug."""

    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)

    return slug.strip("-")


def ensure_default_blog_tags(db: Session) -> int:
    """
    Ensure all predefined blog tags exist.

    Returns the number of newly created tags.

    Existing tags are not overwritten, and repeated calls do not
    create duplicate tags.
    """

    existing_tags = db.query(BlogTag).all()

    existing_names = {
        tag.name.casefold()
        for tag in existing_tags
    }

    existing_slugs = {
        tag.slug.casefold()
        for tag in existing_tags
    }

    created_count = 0

    try:
        for name in DEFAULT_BLOG_TAGS:
            slug = slugify_tag(name)

            # Skip tags that already exist.
            if name.casefold() in existing_names:
                continue

            # Never create a duplicate URL slug.
            if slug.casefold() in existing_slugs:
                logger.warning(
                    "Skipping default blog tag %r because its slug "
                    "%r is already in use.",
                    name,
                    slug,
                )
                continue

            tag = BlogTag(
                name=name,
                slug=slug,
            )

            db.add(tag)

            # Track pending inserts to avoid duplicates within
            # this same seeding operation.
            existing_names.add(name.casefold())
            existing_slugs.add(slug.casefold())

            created_count += 1

        if created_count:
            db.commit()

            logger.info(
                "Created %d default TorqueTrader blog tags.",
                created_count,
            )
        else:
            logger.info(
                "Default TorqueTrader blog tags already exist."
            )

        return created_count

    except Exception:
        db.rollback()

        logger.exception(
            "Failed to seed default TorqueTrader blog tags."
        )

        raise