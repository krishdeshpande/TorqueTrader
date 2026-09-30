import logging
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.blog import BlogPost, BlogTag, BlogReport, PostStatus
from app.models.user import User
from app.schemas.blog import PostCreate, PostUpdate

logger = logging.getLogger(__name__)

def extract_text_from_tiptap(node: dict) -> str:
    """Recursively extract plain text from Tiptap JSON for DB-agnostic search."""
    text = ""
    if isinstance(node, dict):
        if node.get("type") == "text" and "text" in node:
            text += node["text"] + " "
        if "content" in node and isinstance(node["content"], list):
            for child in node["content"]:
                text += extract_text_from_tiptap(child)
    elif isinstance(node, list):
        for child in node:
            text += extract_text_from_tiptap(child)
    return text.strip()

def get_tags(db: Session) -> List[BlogTag]:
    return db.query(BlogTag).order_by(BlogTag.name).all()

def get_posts(
    db: Session, 
    skip: int = 0, 
    limit: int = 20, 
    search: Optional[str] = None, 
    tag_slug: Optional[str] = None
) -> List[BlogPost]:
    query = db.query(BlogPost).filter(BlogPost.status == PostStatus.PUBLISHED.value)
    
    if search:
        search_pattern = f"%{search}%"
        # Dialect-aware case-insensitive search via SQLAlchemy's ilike
        query = query.join(User).filter(
            or_(
                BlogPost.title.ilike(search_pattern),
                BlogPost.search_text.ilike(search_pattern),
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern)
            )
        )
        
    if tag_slug:
        query = query.join(BlogPost.tags).filter(BlogTag.slug == tag_slug)
        
    return query.order_by(BlogPost.published_at.desc()).offset(skip).limit(limit).all()

def get_post_by_id(db: Session, post_id: int) -> BlogPost:
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

def get_my_drafts(db: Session, user_id: int) -> List[BlogPost]:
    return db.query(BlogPost).filter(
        BlogPost.author_id == user_id, 
        BlogPost.status == PostStatus.DRAFT.value
    ).order_by(BlogPost.updated_at.desc()).all()

def create_post(db: Session, post_in: PostCreate, author_id: int) -> BlogPost:
    tags = db.query(BlogTag).filter(BlogTag.id.in_(post_in.tag_ids)).all()
    if len(tags) != len(post_in.tag_ids):
        raise HTTPException(status_code=400, detail="One or more invalid tags")
        
    search_text = extract_text_from_tiptap(post_in.content)
    
    db_post = BlogPost(
        author_id=author_id,
        title=post_in.title,
        content=post_in.content,
        cover_image_key=post_in.cover_image_key,
        status=post_in.status,
        search_text=search_text,
        published_at=datetime.now(timezone.utc) if post_in.status == PostStatus.PUBLISHED.value else None
    )
    db_post.tags = tags
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def update_post(db: Session, post_id: int, post_in: PostUpdate, author_id: int) -> BlogPost:
    post = get_post_by_id(db, post_id)
    if post.author_id != author_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
        
    if post_in.title is not None: post.title = post_in.title
    if post_in.content is not None: 
        post.content = post_in.content
        post.search_text = extract_text_from_tiptap(post_in.content)
    if post_in.cover_image_key is not None: post.cover_image_key = post_in.cover_image_key
    
    if post_in.status is not None and post_in.status != post.status.value:
        post.status = post_in.status
        if post_in.status == PostStatus.PUBLISHED.value and not post.published_at:
            post.published_at = datetime.now(timezone.utc)
            
    if post_in.tag_ids is not None:
        tags = db.query(BlogTag).filter(BlogTag.id.in_(post_in.tag_ids)).all()
        if len(tags) != len(post_in.tag_ids):
            raise HTTPException(status_code=400, detail="One or more invalid tags")
        post.tags = tags
        
    db.commit()
    db.refresh(post)
    return post

def delete_post(db: Session, post_id: int, author_id: int):
    post = get_post_by_id(db, post_id)
    if post.author_id != author_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    db.delete(post)
    db.commit()

def report_post(db: Session, post_id: int, reporter_id: int, reason: str):
    post = get_post_by_id(db, post_id)
    if post.status != PostStatus.PUBLISHED.value:
        raise HTTPException(status_code=400, detail="Can only report published posts")
        
    existing = db.query(BlogReport).filter(
        BlogReport.post_id == post_id, 
        BlogReport.reporter_id == reporter_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reported this post")
        
    report = BlogReport(post_id=post_id, reporter_id=reporter_id, reason=reason)
    db.add(report)
    db.commit()