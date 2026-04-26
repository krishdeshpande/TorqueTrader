"""
TorqueTrader — Security stubs.

This module is OWNED BY THE AUTH TEAM and will be replaced with real
JWT / OAuth2 implementations.  The stubs below exist solely so that
the Inventory & Search modules can import the dependency callables
without breaking at load time.

DO NOT ship these stubs to production.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class CurrentUser:
    """Minimal representation returned by the auth dependency."""

    id: int
    is_admin: bool = False


# ---------------------------------------------------------------------------
# Placeholder dependencies — Auth team will replace these.
# ---------------------------------------------------------------------------

async def get_current_user() -> CurrentUser:
    """Return the authenticated user extracted from the request token.

    **Stub** — always returns a fake user until the Auth team wires up
    the real JWT verification logic.
    """
    raise NotImplementedError(
        "get_current_user must be implemented by the Auth team."
    )


async def require_admin() -> CurrentUser:
    """Return the authenticated user only if they have admin privileges.

    **Stub** — raises until the Auth team provides a real implementation.
    """
    raise NotImplementedError(
        "require_admin must be implemented by the Auth team."
    )
