"""
DICOM processing routes
"""
import os
import shutil
from typing import List, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

router = APIRouter()


class ProcessingRequest(BaseModel):
    """Request model for processing jobs"""
    job_type: str = Field(..., description="Type of processing job")
    job_id: str = Field(None, description="Optional job ID for tracking")


class JobStatusResponse(BaseModel):
    """Response model for job status"""
    job_id: str
    status: str
    progress: int
    created_at: str
    updated_at: str
    result: Dict[str, Any] = None
    error: str = None


@router.post("/process-dicom", response_model=Dict[str, Any])
async def process_dicom_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    job_id: str = Form(None, description="Optional job ID")
):
    """Upload and process DICOM files asynchronously"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager, ml_processor

        # Validate file count
        if len(files) == 0:
            raise HTTPException(status_code=400, detail="No files uploaded")

        if len(files) > 10:  # Limit concurrent uploads
            raise HTTPException(status_code=400, detail="Too many files. Maximum 10 files allowed.")

        # Validate file types
        allowed_extensions = {'.dcm', '.dicom'}
        for file in files:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {file.filename}. Only DICOM files (.dcm, .dicom) are allowed."
                )

        # Create job
        job_type = "dicom_processing"
        payload = {
            "file_count": len(files),
            "file_names": [f.filename for f in files]
        }

        if not job_id:
            job_id = await job_manager.create_job(job_type, payload)
        else:
            # Update existing job if provided
            await job_manager.update_job_status(job_id, "processing", progress=10)

        # Save uploaded files
        upload_dir = os.path.join(settings.UPLOAD_DIR, job_id)
        os.makedirs(upload_dir, exist_ok=True)

        file_paths = []
        for i, file in enumerate(files):
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_paths.append(file_path)

            # Update progress
            progress = int(20 + (i / len(files)) * 30)
            await job_manager.update_job_status(job_id, "processing", progress=progress)

        # Add processing task to background
        background_tasks.add_task(process_dicom_background, job_id, file_paths)

        logger.info("DICOM processing job initiated",
                   job_id=job_id,
                   file_count=len(files))

        return {
            "job_id": job_id,
            "status": "processing",
            "message": "DICOM files uploaded successfully. Processing started.",
            "estimated_time": f"{len(files) * 30}s"  # Rough estimate
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to initiate DICOM processing", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


async def process_dicom_background(job_id: str, file_paths: List[str]):
    """Background task for DICOM processing"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager, ml_processor

        await job_manager.update_job_status(job_id, "processing", progress=50)

        # Process files with ML model
        results = await ml_processor.process_dicom_files(file_paths, job_id)

        # Update job with results
        await job_manager.update_job_status(
            job_id,
            "completed",
            progress=100,
            result=results
        )

        # Clean up uploaded files (optional - keep for debugging)
        # shutil.rmtree(os.path.dirname(file_paths[0]), ignore_errors=True)

        logger.info("DICOM processing completed", job_id=job_id)

    except Exception as e:
        logger.error("DICOM processing failed", job_id=job_id, error=str(e))
        await job_manager.update_job_status(
            job_id,
            "failed",
            progress=0,
            error=str(e)
        )


@router.get("/job/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get processing job status"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager

        job_status = await job_manager.get_job_status(job_id)

        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")

        return JobStatusResponse(**job_status)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get job status", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/job/{job_id}/results")
async def get_job_results(job_id: str):
    """Get processing job results"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager

        job_status = await job_manager.get_job_status(job_id)

        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")

        if job_status["status"] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Job not completed. Current status: {job_status['status']}"
            )

        return job_status["result"]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get job results", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/job/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a processing job"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager

        cancelled = await job_manager.cancel_job(job_id)

        if not cancelled:
            raise HTTPException(status_code=400, detail="Job could not be cancelled")

        return {"message": "Job cancelled successfully", "job_id": job_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to cancel job", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/job/{job_id}/retry")
async def retry_job(job_id: str):
    """Retry a failed job"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager

        retried = await job_manager.retry_failed_job(job_id)

        if not retried:
            raise HTTPException(status_code=400, detail="Job could not be retried")

        return {"message": "Job retry initiated", "job_id": job_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to retry job", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/jobs/active")
async def get_active_jobs():
    """Get all active jobs"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager

        jobs = await job_manager.get_jobs_by_status("processing")
        pending_jobs = await job_manager.get_jobs_by_status("pending")

        return {
            "processing": jobs,
            "pending": pending_jobs,
            "total_active": len(jobs) + len(pending_jobs)
        }

    except Exception as e:
        logger.error("Failed to get active jobs", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/jobs/failed")
async def get_failed_jobs():
    """Get failed jobs for review"""
    try:
        # Import here to avoid circular imports
        from app.main import job_manager

        jobs = await job_manager.get_jobs_by_status("failed", limit=20)

        return {"failed_jobs": jobs, "count": len(jobs)}

    except Exception as e:
        logger.error("Failed to get failed jobs", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
