from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.services import media_service
from app.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.user import UserRole, User
from app.models.media import Media, BucketType
from app.config import settings

router = APIRouter(prefix="/media", tags=["Media"])

@router.post("/public/bike-photo")
def upload_bike_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker([UserRole.individual_seller, UserRole.dealer])),
    db: Session = Depends(get_db)
):
    filename = media_service.process_and_upload_public_photo(file)
    
    media_record = Media(
        user_id=current_user.id,
        file_name=file.filename,
        s3_key=filename,
        bucket_type=BucketType.public
    )
    db.add(media_record)
    db.commit()
    db.refresh(media_record)
    
    # Fixed settings.PUBLIC_BUCKET_NAME -> settings.R2_PUBLIC_BUCKET
    return {"message": "Public photo uploaded successfully", "media_id": media_record.id, "url": f"/mock-s3/{settings.R2_PUBLIC_BUCKET}/{filename}"}

@router.post("/public/blog-image")
def upload_blog_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user), # Any authenticated user
    db: Session = Depends(get_db)
):
    filename = media_service.process_and_upload_public_photo(file)
    
    media_record = Media(
        user_id=current_user.id,
        listing_id=None,
        file_name=file.filename,
        s3_key=filename,
        bucket_type=BucketType.public
    )
    db.add(media_record)
    db.commit()
    db.refresh(media_record)
    
    return {"message": "Public blog image uploaded", "media_id": media_record.id, "url": f"/mock-s3/{settings.R2_PUBLIC_BUCKET}/{filename}"}

@router.post("/private/verification-doc")
def upload_verification_doc(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker([UserRole.dealer])),
    db: Session = Depends(get_db)
):
    filename = media_service.upload_private_document(file)
    
    media_record = Media(
        user_id=current_user.id,
        file_name=file.filename,
        s3_key=filename,
        bucket_type=BucketType.private
    )
    db.add(media_record)
    db.commit()
    db.refresh(media_record)
    
    return {"message": "Private document uploaded successfully", "media_id": media_record.id}

@router.get("/private/{media_id}/presigned-url")
def get_presigned_url(
    media_id: int,
    current_user: User = Depends(RoleChecker([UserRole.admin])),
    db: Session = Depends(get_db)
):
    media = db.query(Media).filter(Media.id == media_id, Media.bucket_type == BucketType.private).first()
    if not media:
        return {"error": "Media not found or not private"}
        
    # Fixed settings.PRIVATE_BUCKET_NAME -> settings.R2_PRIVATE_BUCKET
    url = media_service.generate_presigned_url(settings.R2_PRIVATE_BUCKET, media.s3_key)
    return {"url": url}