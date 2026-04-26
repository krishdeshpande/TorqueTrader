"""
TorqueTrader — Database engine, session factory, and declarative base.

Uses PostgreSQL via psycopg2.  The connection URL is read from the
DATABASE_URL environment variable (falls back to a local dev default).
"""

from __future__ import annotations

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://torquetrader:torquetrader@localhost:5432/torquetrader",
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Recycle stale connections transparently
    pool_size=10,              # Sensible default for moderate traffic
    max_overflow=20,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model in the project."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped database session.

    The session is committed implicitly on success (caller is responsible
    for explicit commits in service functions) and rolled back + closed
    on any unhandled exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
