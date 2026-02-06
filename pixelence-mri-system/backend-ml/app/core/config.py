"""
Configuration settings for the ML service
"""
import os
from typing import List
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_PORT: int = Field(default=8000, env="API_PORT")
    API_WORKERS: int = Field(default=1, env="API_WORKERS")

    # CORS Settings
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        env="ALLOWED_ORIGINS"
    )

    # Redis Settings
    REDIS_HOST: str = Field(default="localhost", env="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, env="REDIS_PORT")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")
    REDIS_PASSWORD: str = Field(default="", env="REDIS_PASSWORD")

    # Database Settings
    DATABASE_URL: str = Field(
        default="postgresql://user:password@localhost/pixelence_ml",
        env="DATABASE_URL"
    )

    # ML Model Settings
    MODEL_PATH: str = Field(default="./models", env="MODEL_PATH")
    MODEL_VERSION: str = Field(default="v1.0", env="MODEL_VERSION")

    # GPU Settings
    GPU_MEMORY_LIMIT: float = Field(default=0.9, env="GPU_MEMORY_LIMIT")  # 90% of GPU memory
    GPU_DEVICES: str = Field(default="0", env="GPU_DEVICES")  # GPU device IDs

    # Processing Settings
    MAX_CONCURRENT_JOBS: int = Field(default=3, env="MAX_CONCURRENT_JOBS")
    JOB_TIMEOUT_SECONDS: int = Field(default=3600, env="JOB_TIMEOUT_SECONDS")  # 1 hour
    BATCH_SIZE: int = Field(default=8, env="BATCH_SIZE")

    # File Storage Settings
    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")
    RESULTS_DIR: str = Field(default="./results", env="RESULTS_DIR")
    MAX_FILE_SIZE_MB: int = Field(default=100, env="MAX_FILE_SIZE_MB")

    # Security Settings
    SECRET_KEY: str = Field(default="your-secret-key-here", env="SECRET_KEY")
    API_KEY: str = Field(default="", env="API_KEY")

    # Logging Settings
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")

    # Monitoring Settings
    SENTRY_DSN: str = Field(default="", env="SENTRY_DSN")
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
