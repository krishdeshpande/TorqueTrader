import enum
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, JSON, UniqueConstraint, func, Enum, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class PostStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"

def _enum_values(enum_type: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_type]

class BlogTag(Base):
    __tablename__ = "blog_tags"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    
    posts: Mapped[List["BlogPost"]] = relationship(
        "BlogPost", secondary="blog_post_tags", back_populates="tags"
    )

class BlogPost(Base):
    __tablename__ = "blog_posts"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    cover_image_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    status: Mapped[PostStatus] = mapped_column(
        Enum(PostStatus, name="blog_post_status", native_enum=True, values_callable=_enum_values),
        nullable=False, default=PostStatus.DRAFT, server_default="draft", index=True
    )
    search_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now(), onupdate=lambda: datetime.now(timezone.utc))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    author: Mapped["User"] = relationship("User", lazy="joined")
    tags: Mapped[List["BlogTag"]] = relationship("BlogTag", secondary="blog_post_tags", back_populates="posts", lazy="selectin")
    reports: Mapped[List["BlogReport"]] = relationship("BlogReport", back_populates="post", cascade="all, delete-orphan", passive_deletes=True)

blog_post_tags = Table(
    "blog_post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("blog_tags.id", ondelete="CASCADE"), primary_key=True),
)

class BlogReport(Base):
    __tablename__ = "blog_reports"
    __table_args__ = (
        UniqueConstraint('post_id', 'reporter_id', name='uq_blog_report_user_post'),
    )
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    reporter_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())

    post: Mapped["BlogPost"] = relationship("BlogPost", back_populates="reports")