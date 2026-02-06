"""
Health check routes
"""
from fastapi import APIRouter, HTTPException
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "Pixelence ML Processing Service"
    }


@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with component status"""
    try:
        # Import here to avoid circular imports
        from app.main import ml_processor, job_manager, redis_client

        health_status = {
            "status": "healthy",
            "service": "Pixelence ML Processing Service",
            "components": {
                "ml_processor": {
                    "status": "healthy" if ml_processor and ml_processor.is_model_loaded() else "unhealthy",
                    "model_loaded": ml_processor.is_model_loaded() if ml_processor else False,
                    "gpu_info": ml_processor.get_gpu_memory_usage() if ml_processor else None
                },
                "job_manager": {
                    "status": "healthy" if job_manager else "unhealthy",
                },
                "redis": {
                    "status": "healthy" if redis_client else "unhealthy",
                }
            }
        }

        # Check if all components are healthy
        all_healthy = all(
            comp["status"] == "healthy"
            for comp in health_status["components"].values()
        )

        if not all_healthy:
            health_status["status"] = "degraded"
            raise HTTPException(status_code=503, detail=health_status)

        return health_status

    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail={
            "status": "unhealthy",
            "error": str(e)
        })


@router.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    try:
        # Import here to avoid circular imports
        from app.main import ml_processor

        if not ml_processor or not ml_processor.is_model_loaded():
            raise HTTPException(status_code=503, detail="ML processor not ready")

        return {"status": "ready"}

    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive"}
