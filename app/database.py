from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# ── Engine configuration ───────────────────────────────────────────────────
# SQLite is used for local development; PostgreSQL for production.
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

_is_sqlite = db_url.startswith("sqlite")

connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    # Connection pool settings (ignored by SQLite's StaticPool in tests)
    pool_pre_ping=True,     # Detect stale connections
    pool_size=5 if not _is_sqlite else 1,
    max_overflow=10 if not _is_sqlite else 0,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session, always closes on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
