"""
TorqueTrader — Media service.

File storage: Cloudflare R2 (S3-compatible object store, free tier: 10 GB).
  - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY must be set in prod.
  - If R2 credentials are absent, files are stored locally in mock_s3/ (dev only).

Security:
  - MIME type is sniffed from raw bytes (not from the filename) to prevent
    extension-spoofing attacks.
  - Filenames are replaced with a UUID — no user input reaches the filesystem/S3.
  - Images are re-compressed through Pillow, stripping EXIF metadata.
"""

import logging
import os
import uuid
from io import BytesIO

import magic
from PIL import Image
from fastapi import HTTPException, UploadFile, status

from app.config import settings

logger = logging.getLogger(__name__)

# ── Storage backend ───────────────────────────────────────────────────────────

def _get_s3_client():
    """Return a boto3 S3 client pointed at Cloudflare R2 (or None for mock mode)."""
    if not all([settings.R2_ACCOUNT_ID, settings.R2_ACCESS_KEY_ID, settings.R2_SECRET_ACCESS_KEY]):
        return None
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


MOCK_S3_DIR = "mock_s3"


def _store_bytes(bucket: str, key: str, data: bytes, content_type: str) -> str:
    """Write bytes to R2 (prod) or local mock_s3/ dir (dev). Returns the storage key."""
    s3 = _get_s3_client()
    if s3:
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        logger.info("Uploaded %s to R2 bucket %s", key, bucket)
    else:
        # Dev fallback: write to disk
        dest_dir = os.path.join(MOCK_S3_DIR, bucket)
        os.makedirs(dest_dir, exist_ok=True)
        with open(os.path.join(dest_dir, key), "wb") as f:
            f.write(data)
        logger.warning("R2 not configured — saved %s to local mock_s3/", key)
    return key


# ── MIME validation ───────────────────────────────────────────────────────────

def _validate_mime(content: bytes, allowed: list[str]) -> str:
    mime = magic.from_buffer(content, mime=True)
    if mime not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{mime}'. Allowed: {', '.join(allowed)}",
        )
    return mime


# ── Public service functions ──────────────────────────────────────────────────

def process_and_upload_public_photo(file: UploadFile) -> str:
    """
    Validate, compress, strip EXIF, and upload a bike photo to the public bucket.
    Returns the storage key (UUID-based filename).
    """
    content = file.file.read()
    _validate_mime(content, ["image/jpeg", "image/png", "image/webp"])

    # Re-compress through Pillow — strips EXIF, normalises format
    img = Image.open(BytesIO(content))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Resize if larger than 2000px on longest edge (keeps file sizes sane)
    max_dim = 2000
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    output = BytesIO()
    img.save(output, format="JPEG", quality=80, optimize=True)
    compressed = output.getvalue()

    key = f"{uuid.uuid4()}.jpg"
    return _store_bytes(settings.R2_PUBLIC_BUCKET, key, compressed, "image/jpeg")


def upload_private_document(file: UploadFile) -> str:
    """
    Validate and upload a private verification document (PDF or image).
    Returns the storage key.
    """
    content = file.file.read()
    _validate_mime(content, ["image/jpeg", "image/png", "application/pdf"])

    ext = "pdf" if content[:4] == b"%PDF" else "jpg"
    key = f"{uuid.uuid4()}.{ext}"
    content_type = "application/pdf" if ext == "pdf" else "image/jpeg"
    return _store_bytes(settings.R2_PRIVATE_BUCKET, key, content, content_type)


def generate_presigned_url(bucket: str, key: str, expiration: int = 3600) -> str:
    """Generate a time-limited pre-signed URL for private document access."""
    s3 = _get_s3_client()
    if s3:
        return s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expiration,
        )
    # Dev fallback
    local_path = os.path.join(MOCK_S3_DIR, bucket, key)
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="File not found in mock store.")
    return f"http://localhost:8000/mock-s3/{bucket}/{key}?Expires={expiration}&Signature=mock"
