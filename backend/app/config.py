import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    # Default to sqlite for seamless zero-setup, configurable to PostgreSQL via env DATABASE_URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./spk_ag.db"
    )
    
    # Redis & Celery Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    CELERY_TASK_TIME_LIMIT: int = 600

    # Academic default
    CURRENT_ACADEMIC_YEAR: str = "2026/2027"
    CURRENT_SEMESTER_TYPE: str = "ODD"

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
