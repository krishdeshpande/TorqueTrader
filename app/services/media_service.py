import os
import uuid
import magic
from io import BytesIO
from PIL import Image
from fastapi import UploadFile, HTTPException, status
from app.config import settings

MOCK_S3_DIR = "mock_s3"

# Ensure mock S3 directory exists
os.makedirs(os.path.join(MOCK_S3_DIR, settings.PUBLIC_BUCKET_NAME), exist_ok=True)
os.makedirs(os.path.join(MOCK_S3_DIR, settings.PRIVATE_BUCKET_NAME), exist_ok=True)

def validate_mime_type(file_content: bytes, allowed_mimes: list[str]):
    mime = magic.from_buffer(file_content, mime=True)
    if mime not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {mime}. Allowed types: {', '.join(allowed_mimes)}"
        )
    return mime

def process_and_upload_public_photo(file: UploadFile) -> str:
    content = file.file.read()
    
    # 1. MIME Inspection
    validate_mime_type(content, ["image/jpeg", "image/png", "image/webp"])
    
    # 2. Randomize Filename to prevent RCE/directory traversal
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    new_filename = f"{uuid.uuid4()}.{ext}"
    
    # 3. Compress Image
    image = Image.open(BytesIO(content))
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    output_io = BytesIO()
    # Save compressed
    image.save(output_io, format="JPEG", quality=75)
    compressed_content = output_io.getvalue()
    
    # 4. Upload to Mock S3 (Public Bucket)
    filepath = os.path.join(MOCK_S3_DIR, settings.PUBLIC_BUCKET_NAME, new_filename)
    with open(filepath, "wb") as f:
        f.write(compressed_content)
        
    return new_filename

def upload_private_document(file: UploadFile) -> str:
    content = file.file.read()
    
    # 1. MIME Inspection (Allow PDFs and Images)
    validate_mime_type(content, ["image/jpeg", "image/png", "application/pdf"])
    
    # 2. Randomize Filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
    new_filename = f"{uuid.uuid4()}.{ext}"
    
    # 3. Upload to Mock S3 (Private Bucket)
    filepath = os.path.join(MOCK_S3_DIR, settings.PRIVATE_BUCKET_NAME, new_filename)
    with open(filepath, "wb") as f:
        f.write(content)
        
    return new_filename

def generate_presigned_url(bucket_name: str, object_name: str, expiration=3600):
    # Mocking Boto3 presigned URL generation
    filepath = os.path.join(MOCK_S3_DIR, bucket_name, object_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
        
    return f"http://localhost:8000/mock-s3/{bucket_name}/{object_name}?Expires={expiration}&Signature=mock_signature"
