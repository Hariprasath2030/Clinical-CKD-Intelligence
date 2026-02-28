"""
Configuration module for backend settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/ckd_intelligence"
    )
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    
    # API
    API_TITLE: str = "CKD Intelligence API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "AI-powered chronic kidney disease prediction and decision support"
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost:3000",
    ]
    
    # ML Models path
    MODELS_PATH: str = "./models/saved_models"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache()
def get_settings():
    """Get cached settings"""
    return Settings()
