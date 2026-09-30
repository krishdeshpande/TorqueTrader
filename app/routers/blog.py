from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas.blog import TagResponse, PostCreate, PostUpdate, PostResponse, ReportCreate
from app.services import blog_service

router = APIRouter(prefix="/blog", tags=["Blog"])

@router.get("/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    return blog_service.get_tags(db)

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return blog_service.get_posts(db, skip=skip, limit=limit, search=search, tag_slug=tag)

@router.get("/my/drafts", response_model=List[PostResponse])
def get_my_drafts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return blog_service.get_my_drafts(db, current_user.id)

@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    post = blog_service.get_post_by_id(db, post_id)
    if post.status == "draft":
        if not current_user or current_user.id != post.author_id:
            raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/posts", response_model=PostResponse, status_code=201)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return blog_service.create_post(db, post_in, current_user.id)

@router.put("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_in: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return blog_service.update_post(db, post_id, post_in, current_user.id)

@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blog_service.delete_post(db, post_id, current_user.id)
    return None

@router.post("/posts/{post_id}/report", status_code=201)
def report_post(
    post_id: int,
    report_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blog_service.report_post(db, post_id, current_user.id, report_in.reason)
    return {"message": "Report submitted successfully"}