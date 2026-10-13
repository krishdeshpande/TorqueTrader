import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.blog import BlogTag
from app.services.blog_tag_seed import (
    DEFAULT_BLOG_TAGS,
    ensure_default_blog_tags,
)


@pytest.fixture()
def db():
    """
    Provide an isolated in-memory SQLite database
    for each test.
    """

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_seeds_all_default_tags(db):
    """
    An empty tag table should receive all predefined tags.
    """

    created_count = ensure_default_blog_tags(db)

    assert created_count == len(DEFAULT_BLOG_TAGS)

    tags = db.query(BlogTag).all()

    assert len(tags) == len(DEFAULT_BLOG_TAGS)

    names = {tag.name for tag in tags}

    assert names == set(DEFAULT_BLOG_TAGS)


def test_seeding_is_idempotent(db):
    """
    Calling the seeder repeatedly must not create duplicates.
    """

    first_count = ensure_default_blog_tags(db)
    second_count = ensure_default_blog_tags(db)

    assert first_count == len(DEFAULT_BLOG_TAGS)
    assert second_count == 0

    tags = db.query(BlogTag).all()

    assert len(tags) == len(DEFAULT_BLOG_TAGS)


def test_existing_tags_are_preserved(db):
    """
    Existing tags must remain unchanged while missing tags
    are added.
    """

    existing_tag = BlogTag(
        name="My Custom Tag",
        slug="my-custom-tag",
    )

    db.add(existing_tag)
    db.commit()

    original_id = existing_tag.id

    created_count = ensure_default_blog_tags(db)

    assert created_count == len(DEFAULT_BLOG_TAGS)

    db.refresh(existing_tag)

    assert existing_tag.id == original_id
    assert existing_tag.name == "My Custom Tag"
    assert existing_tag.slug == "my-custom-tag"

    tags = db.query(BlogTag).all()

    assert len(tags) == len(DEFAULT_BLOG_TAGS) + 1


def test_default_tag_slugs_are_unique(db):
    """
    Every predefined tag must have a unique URL slug.
    """

    ensure_default_blog_tags(db)

    tags = db.query(BlogTag).all()

    slugs = [tag.slug for tag in tags]

    assert len(slugs) == len(set(slugs))


def test_existing_default_tag_is_not_duplicated(db):
    """
    If a default tag already exists, it must not be inserted
    a second time.
    """

    existing_tag = BlogTag(
        name="Motorcycle",
        slug="motorcycle",
    )

    db.add(existing_tag)
    db.commit()

    original_id = existing_tag.id

    created_count = ensure_default_blog_tags(db)

    assert created_count == len(DEFAULT_BLOG_TAGS) - 1

    motorcycle_tags = (
        db.query(BlogTag)
        .filter(BlogTag.name == "Motorcycle")
        .all()
    )

    assert len(motorcycle_tags) == 1
    assert motorcycle_tags[0].id == original_id