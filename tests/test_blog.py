import re
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.models.user import User, UserRole, UserStatus
from app.models.blog import BlogTag
from app.database import get_db
from app.core.security import create_access_token

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(autouse=True)
def database_override():
    Base.metadata.create_all(bind=engine)
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = _override_get_db
    
    # Seed blog tags manually for the test DB
    session = TestingSessionLocal()
    tags = [
        "Ride Route", "Ride Plan", "Bike Review", "Car Review", "Recommendation", "Advice", 
        "Question", "Discussion", "Experience", "Guide", "How-To", "Buying Guide", "Maintenance", 
        "Modifications", "Gear", "Event", "Motorcycle", "Car", "Scooter", "EV", "Classic", 
        "Sports Bike", "Adventure", "Cruiser", "Touring", "Commuting", "Off-Road", "Track", 
        "Long Ride", "Group Ride", "Solo Ride", "Beginner"
    ]
    for tag in tags:
        slug = re.sub(r'[^\w\s-]', '', tag.lower().strip())
        slug = re.sub(r'[\s_-]+', '-', slug).strip('-')
        session.add(BlogTag(name=tag, slug=slug))
    session.commit()
    session.close()
    
    yield
    
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original_overrides)
    Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token({"sub": user.email, "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture()
def auth_headers(db):
    user = User(email="author@example.com", role=UserRole.buyer, status=UserStatus.active)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _auth_header(user)

@pytest.fixture()
def second_auth_headers(db):
    user = User(email="other@example.com", role=UserRole.buyer, status=UserStatus.active)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _auth_header(user)

client = TestClient(app)

def test_get_tags(db):
    response = client.get("/blog/tags")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 32
    assert any(t['name'] == 'Motorcycle' for t in data)

def test_create_post_requires_auth(db):
    response = client.post("/blog/posts", json={
        "title": "Test", "content": {"type": "doc"}, "tag_ids": [1]
    })
    assert response.status_code == 401

def test_create_post_and_get_draft(auth_headers, db):
    tag = db.query(BlogTag).first()
    
    response = client.post("/blog/posts", json={
        "title": "My Draft",
        "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}]},
        "tag_ids": [tag.id],
        "status": "draft"
    }, headers=auth_headers)
    assert response.status_code == 201
    post_id = response.json()['id']
    
    pub_response = client.get("/blog/posts")
    pub_ids = [p['id'] for p in pub_response.json()]
    assert post_id not in pub_ids
    
    drafts_response = client.get("/blog/my/drafts", headers=auth_headers)
    draft_ids = [p['id'] for p in drafts_response.json()]
    assert post_id in draft_ids

def test_publish_post(auth_headers, db):
    tag = db.query(BlogTag).first()
    res = client.post("/blog/posts", json={
        "title": "Published", "content": {"type": "doc"}, "tag_ids": [tag.id], "status": "published"
    }, headers=auth_headers)
    post_id = res.json()['id']
    
    pub_response = client.get("/blog/posts")
    pub_ids = [p['id'] for p in pub_response.json()]
    assert post_id in pub_ids

def test_tag_limit_enforced(auth_headers, db):
    tags = db.query(BlogTag).limit(6).all()
    tag_ids = [t.id for t in tags]
    
    response = client.post("/blog/posts", json={
        "title": "Too many tags", "content": {"type": "doc"}, "tag_ids": tag_ids
    }, headers=auth_headers)
    assert response.status_code == 422 

def test_ownership_enforcement(auth_headers, second_auth_headers, db):
    tag = db.query(BlogTag).first()
    res = client.post("/blog/posts", json={
        "title": "My Post", "content": {"type": "doc"}, "tag_ids": [tag.id]
    }, headers=auth_headers)
    post_id = res.json()['id']
    
    del_res = client.delete(f"/blog/posts/{post_id}", headers=second_auth_headers)
    assert del_res.status_code == 403

def test_search_functionality(auth_headers, db):
    tag = db.query(BlogTag).first()
    client.post("/blog/posts", json={
        "title": "UniqueSearchTerm123", 
        "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "HiddenContent456"}]}]}, 
        "tag_ids": [tag.id], 
        "status": "published"
    }, headers=auth_headers)
    
    res1 = client.get("/blog/posts?search=UniqueSearchTerm123")
    assert len(res1.json()) > 0
    
    res2 = client.get("/blog/posts?search=HiddenContent456")
    assert len(res2.json()) > 0

def test_unique_report_constraint(auth_headers, db):
    tag = db.query(BlogTag).first()
    res = client.post("/blog/posts", json={
        "title": "Report Me", "content": {"type": "doc"}, "tag_ids": [tag.id], "status": "published"
    }, headers=auth_headers)
    post_id = res.json()['id']
    
    r1 = client.post(f"/blog/posts/{post_id}/report", json={"reason": "Spam content here and there"}, headers=auth_headers)
    assert r1.status_code == 201
    
    r2 = client.post(f"/blog/posts/{post_id}/report", json={"reason": "Spam content again and again"}, headers=auth_headers)
    assert r2.status_code == 400
    assert "already reported" in r2.json()['detail']