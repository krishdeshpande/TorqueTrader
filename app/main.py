"""
TorqueTrader — FastAPI application entry-point.

Registers all routers and configures application-wide middleware.
Run with:  ``uvicorn app.main:app --reload``
"""

from __future__ import annotations

from fastapi import FastAPI

from app.routers.listings import router as listings_router

app = FastAPI(
    title="TorqueTrader API",
    version="0.1.0",
    description=(
        "A transparency-focused C2C marketplace for premium superbikes. "
        "This API powers the Core Inventory and Enthusiast Search Engine."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(listings_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Ops"], summary="Health check")
def health_check() -> dict:
    """Lightweight liveness probe for load-balancer / k8s readiness."""
    return {"status": "ok", "service": "torquetrader"}
