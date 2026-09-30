from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str

class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: Dict[str, Any]
    cover_image_key: Optional[str] = None
    tag_ids: List[int] = Field(..., min_length=1, max_length=5)
    status: str = "draft"

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v not in ('draft', 'published'):
            raise ValueError('Status must be draft or published')
        return v

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[Dict[str, Any]] = None
    cover_image_key: Optional[str] = None
    tag_ids: Optional[List[int]] = Field(None, min_length=1, max_length=5)
    status: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ('draft', 'published'):
            raise ValueError('Status must be draft or published')
        return v

class AuthorPreview(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str

class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    author_id: int
    author: AuthorPreview
    title: str
    content: Dict[str, Any]
    cover_image_key: Optional[str] = None
    status: str
    tags: List[TagResponse]
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

class ReportCreate(BaseModel):
    reason: str = Field(..., min_length=10, max_length=1000)