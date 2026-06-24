from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine
from app.models.base import Base
import app.models  # noqa: F401 — registers all ORM models so Base.metadata is complete
from app.routers import auth, media, leads, listings

# ── Create tables (SQLite dev / first-run only) ───────────────────────────────
# In production, run: alembic upgrade head
Base.metadata.create_all(bind=engine)

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "TorqueTrader API — a transparency-focused C2C marketplace for premium superbikes."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security headers ──────────────────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(media.router)
app.include_router(leads.router)
app.include_router(listings.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Ops"], summary="Liveness probe")
def health():
    return {"status": "ok", "version": settings.VERSION}


@app.get("/", tags=["Ops"])
@limiter.limit("5/minute")
def root(request: Request):
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}
