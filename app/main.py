from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import engine
from app.models import base
from app.routers import auth, media, leads

# Create database tables
base.Base.metadata.create_all(bind=engine)

# Setup SlowAPI Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="TorqueTrader API")

# Add Rate Limiting to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Include routers
app.include_router(auth.router)
app.include_router(media.router)
app.include_router(leads.router)

@app.get("/")
@limiter.limit("5/minute")
def root(request: Request):
    return {"message": "Welcome to TorqueTrader API"}
