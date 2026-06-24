"""Root conftest — ensure the project root is on sys.path and JWT_SECRET_KEY is set for tests."""

import sys
import os
from pathlib import Path

# Add project root to sys.path so `app` is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Set a test JWT secret so pydantic-settings doesn't raise a ValidationError
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-do-not-use-in-production")
