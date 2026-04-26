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
    
    # Save to database
    media_record = Media(
        user_id=current_user.id,
        file_name=file.filename,
        s3_key=filename,
        bucket_type=BucketType.public
    )
    db.add(media_record)
    db.commit()
    db.refresh(media_record)
    
    return {"message": "Public photo uploaded successfully", "media_id": media_record.id, "url": f"/mock-s3/{settings.PUBLIC_BUCKET_NAME}/{filename}"}

@router.post("/private/verification-doc")
def upload_verification_doc(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker([UserRole.dealer])), # Only dealers upload verification docs
    db: Session = Depends(get_db)
):
    filename = media_service.upload_private_document(file)
    
    # Save to database
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
        
    url = media_service.generate_presigned_url(settings.PRIVATE_BUCKET_NAME, media.s3_key)
    return {"url": url}
