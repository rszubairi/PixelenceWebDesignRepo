"""
Pixelence ML Processing Service
FastAPI application for DICOM image processing and AI analysis
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import redis.asyncio as redis
from pydantic import BaseModel
import structlog

# Import our modules
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import processing, health
from app.services.ml_processor import MLProcessor
from app.services.job_manager import JobManager
from app.db.session import init_db

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)

# Global instances
ml_processor = None
job_manager = None
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global ml_processor, job_manager, redis_client

    # Startup
    logger.info("Starting Pixelence ML Service")

    # Initialize Redis
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True
    )

    # Initialize database
    await init_db()

    # Initialize services
    job_manager = JobManager(redis_client)
    ml_processor = MLProcessor()

    # Warm up ML models
    await ml_processor.warm_up()

    logger.info("ML Service startup complete")

    yield

    # Shutdown
    logger.info("Shutting down ML Service")
    if ml_processor:
        await ml_processor.cleanup()
    if redis_client:
        await redis_client.close()

# Create FastAPI app
app = FastAPI(
    title="Pixelence ML Processing Service",
    description="AI-powered DICOM image processing and analysis service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(processing.router, prefix="/api/v1", tags=["processing"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Pixelence ML Processing Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/metrics")
async def metrics():
    """Service metrics endpoint"""
    return {
        "active_jobs": await job_manager.get_active_jobs_count(),
        "completed_jobs_24h": await job_manager.get_completed_jobs_24h(),
        "gpu_memory_usage": ml_processor.get_gpu_memory_usage(),
        "model_loaded": ml_processor.is_model_loaded()
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
