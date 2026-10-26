import logging

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import engine, SessionLocal
from app.models.base import Base

# Register all models so Base.metadata contains every ORM table.
import app.models  # noqa: F401

from app.routers import (
    auth,
    media,
    leads,
    listings,
    advisor,
    feedback,
    blog,
    group_buying,
)

from app.services.blog_tag_seed import ensure_default_blog_tags


logger = logging.getLogger(__name__)


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

# Create missing tables represented in the registered ORM metadata.
#
# This does not replace Alembic migrations. It also does not modify
# the structure of existing tables.
#
# If initialization fails, let the exception propagate instead of
# starting the application with an unusable database.
Base.metadata.create_all(bind=engine)


# ============================================================
# DEFAULT BLOG TAG INITIALIZATION
# ============================================================

# Ensure the predefined blog tags exist.
#
# Existing tags are preserved. Only missing tags are inserted.
# The seeder commits only when it creates new tags.
#
# If seeding fails, log the exception and allow the application
# to start. The error will be visible in the application logs.
# This preserves the previous error-handling behaviour for seeding.

try:
    with SessionLocal() as db:
        created_count = ensure_default_blog_tags(db)

        logger.info(
            "Blog tag initialization completed. New tags created: %d",
            created_count,
        )

except Exception:
    logger.exception(
        "Blog tag initialization failed. "
        "Check database connectivity and application logs."
    )


# ============================================================
# RATE LIMITING
# ============================================================

limiter = Limiter(
    key_func=get_remote_address,
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "TorqueTrader API — a transparency-focused "
        "C2C marketplace for premium superbikes."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)


app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# ============================================================
# CORS
# ============================================================

origins = [
    origin.strip()
    for origin in settings.ALLOWED_ORIGINS.split(",")
]

if "*" in origins or not origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ============================================================
# SECURITY HEADERS
# ============================================================

@app.middleware("http")
async def add_security_headers(
    request: Request,
    call_next,
):
    response: Response = await call_next(request)

    response.headers["X-Frame-Options"] = "DENY"

    response.headers["X-Content-Type-Options"] = "nosniff"

    response.headers["Referrer-Policy"] = (
        "strict-origin-when-cross-origin"
    )

    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )

    return response


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)
app.include_router(media.router)
app.include_router(leads.router)
app.include_router(listings.router)
app.include_router(advisor.router)
app.include_router(feedback.router)
app.include_router(blog.router)
app.include_router(group_buying.router)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/health",
    tags=["Ops"],
    summary="Liveness probe",
)
def health():
    return {
        "status": "ok",
        "version": settings.VERSION,
    }


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get(
    "/",
    tags=["Ops"],
)
@limiter.limit("5/minute")
def root(request: Request):
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
    }