"""
Job Manager Service
Handles async job processing and status tracking with Redis
"""
import json
import uuid
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import redis.asyncio as redis
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


class JobManager:
    """Manages async processing jobs"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.job_prefix = "pixelence:job:"
        self.queue_name = "pixelence:processing_queue"

    async def create_job(self, job_type: str, payload: Dict[str, Any]) -> str:
        """Create a new processing job"""
        job_id = str(uuid.uuid4())
        job_key = f"{self.job_prefix}{job_id}"

        job_data = {
            "job_id": job_id,
            "job_type": job_type,
            "status": "pending",
            "payload": payload,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "progress": 0,
            "result": None,
            "error": None
        }

        # Store job data
        await self.redis.set(job_key, json.dumps(job_data))

        # Add to processing queue
        await self.redis.lpush(self.queue_name, job_id)

        # Set expiration (24 hours)
        await self.redis.expire(job_key, 86400)

        logger.info("Job created", job_id=job_id, job_type=job_type)
        return job_id

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job status"""
        job_key = f"{self.job_prefix}{job_id}"
        job_data = await self.redis.get(job_key)

        if not job_data:
            return None

        return json.loads(job_data)

    async def update_job_status(self, job_id: str, status: str,
                              progress: int = None, result: Any = None,
                              error: str = None):
        """Update job status"""
        job_key = f"{self.job_prefix}{job_id}"
        job_data = await self.redis.get(job_key)

        if not job_data:
            logger.warning("Attempted to update non-existent job", job_id=job_id)
            return

        job_dict = json.loads(job_data)
        job_dict["status"] = status
        job_dict["updated_at"] = datetime.utcnow().isoformat()

        if progress is not None:
            job_dict["progress"] = progress

        if result is not None:
            job_dict["result"] = result

        if error is not None:
            job_dict["error"] = error

        await self.redis.set(job_key, json.dumps(job_dict))

        logger.info("Job status updated",
                   job_id=job_id,
                   status=status,
                   progress=progress)

    async def get_next_job(self) -> Optional[str]:
        """Get next job from queue"""
        job_id = await self.redis.rpop(self.queue_name)
        return job_id

    async def get_active_jobs_count(self) -> int:
        """Get count of active jobs"""
        # Get all job keys
        pattern = f"{self.job_prefix}*"
        job_keys = await self.redis.keys(pattern)

        active_count = 0
        for key in job_keys:
            job_data = await self.redis.get(key)
            if job_data:
                job_dict = json.loads(job_data)
                if job_dict["status"] in ["pending", "processing"]:
                    active_count += 1

        return active_count

    async def get_completed_jobs_24h(self) -> int:
        """Get count of completed jobs in last 24 hours"""
        pattern = f"{self.job_prefix}*"
        job_keys = await self.redis.keys(pattern)

        completed_count = 0
        cutoff_time = datetime.utcnow() - timedelta(hours=24)

        for key in job_keys:
            job_data = await self.redis.get(key)
            if job_data:
                job_dict = json.loads(job_data)
                if (job_dict["status"] == "completed" and
                    datetime.fromisoformat(job_dict["created_at"]) > cutoff_time):
                    completed_count += 1

        return completed_count

    async def cleanup_old_jobs(self, days: int = 7):
        """Clean up jobs older than specified days"""
        pattern = f"{self.job_prefix}*"
        job_keys = await self.redis.keys(pattern)

        cutoff_time = datetime.utcnow() - timedelta(days=days)
        cleaned_count = 0

        for key in job_keys:
            job_data = await self.redis.get(key)
            if job_data:
                job_dict = json.loads(job_data)
                if datetime.fromisoformat(job_dict["created_at"]) < cutoff_time:
                    await self.redis.delete(key)
                    cleaned_count += 1

        logger.info("Old jobs cleaned up", cleaned_count=cleaned_count, days=days)
        return cleaned_count

    async def get_job_queue_length(self) -> int:
        """Get current queue length"""
        return await self.redis.llen(self.queue_name)

    async def retry_failed_job(self, job_id: str) -> bool:
        """Retry a failed job"""
        job_key = f"{self.job_prefix}{job_id}"
        job_data = await self.redis.get(job_key)

        if not job_data:
            return False

        job_dict = json.loads(job_data)

        if job_dict["status"] != "failed":
            return False

        # Reset job status
        job_dict["status"] = "pending"
        job_dict["error"] = None
        job_dict["progress"] = 0
        job_dict["updated_at"] = datetime.utcnow().isoformat()

        await self.redis.set(job_key, json.dumps(job_dict))
        await self.redis.lpush(self.queue_name, job_id)

        logger.info("Job retry initiated", job_id=job_id)
        return True

    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending job"""
        job_key = f"{self.job_prefix}{job_id}"
        job_data = await self.redis.get(job_key)

        if not job_data:
            return False

        job_dict = json.loads(job_data)

        if job_dict["status"] not in ["pending", "processing"]:
            return False

        job_dict["status"] = "cancelled"
        job_dict["updated_at"] = datetime.utcnow().isoformat()

        await self.redis.set(job_key, json.dumps(job_dict))

        # Remove from queue if present
        await self.redis.lrem(self.queue_name, 0, job_id)

        logger.info("Job cancelled", job_id=job_id)
        return True

    async def get_jobs_by_status(self, status: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get jobs by status"""
        pattern = f"{self.job_prefix}*"
        job_keys = await self.redis.keys(pattern)

        jobs = []
        for key in job_keys:
            job_data = await self.redis.get(key)
            if job_data:
                job_dict = json.loads(job_data)
                if job_dict["status"] == status:
                    jobs.append(job_dict)
                    if len(jobs) >= limit:
                        break

        # Sort by creation time (newest first)
        jobs.sort(key=lambda x: x["created_at"], reverse=True)
        return jobs[:limit]
