from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Since we are using SQLite for local dev, we need connect_args={"check_same_thread": False}
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
