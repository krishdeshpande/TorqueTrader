from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TorqueTrader API"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "sqlite:///./torque_trader.db"
    
    # JWT
    JWT_SECRET_KEY: str = "super_secret_key_change_in_production_1234567890" # Make sure to change!
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # OTP
    OTP_TTL_SECONDS: int = 300 # 5 minutes
    MAX_OTP_ATTEMPTS: int = 5
    
    # AWS S3 (Mocked)
    AWS_ACCESS_KEY_ID: str = "mock_access_key"
    AWS_SECRET_ACCESS_KEY: str = "mock_secret_key"
    AWS_REGION: str = "us-east-1"
    PUBLIC_BUCKET_NAME: str = "public-bike-photos"
    PRIVATE_BUCKET_NAME: str = "private-verification-docs"

    class Config:
        env_file = ".env"

settings = Settings()
