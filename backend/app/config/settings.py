import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
# pyrefly: ignore [missing-import]
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "StockSense AI"
    API_V1_STR: str = "/api"
    
    # Database Settings
    DATABASE_URL: str = Field(
        default="sqlite:///data/stocksense.db",
        validation_alias="DATABASE_URL"
    )
    
    # JWT Auth
    SECRET_KEY: str = Field(
        default="super-secret-key-for-jwt-authentication-stocksense-ai-2026",
        validation_alias="SECRET_KEY"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Gemini API
    GEMINI_API_KEY: str | None = Field(
        default=None,
        validation_alias="GEMINI_API_KEY"
    )
    
    # Google Cloud Storage Settings
    GCP_BUCKET_NAME: str | None = Field(
        default=None,
        validation_alias="GCP_BUCKET_NAME"
    )
    GOOGLE_APPLICATION_CREDENTIALS: str | None = Field(
        default=None,
        validation_alias="GOOGLE_APPLICATION_CREDENTIALS"
    )
    
    # Fallback storage for GCS when local
    LOCAL_STORAGE_DIR: str = "data/storage"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
