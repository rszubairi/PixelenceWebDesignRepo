/**
 * Jobs Management Routes
 * Provides endpoints for managing and monitoring processing jobs
 */

const express = require('express');
const winston = require('winston');

const router = express.Router();

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');

// Import services
const { getRedisClient } = require('../services/redis');
const { getMLServiceClient } = require('../services/mlService');

/**
 * GET /api/jobs
 * Get user's recent jobs
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const redis = getRedisClient();
    const userId = req.user.id;

    // Get all job keys for this user
    const pattern = `job:*`;
    const jobKeys = await redis.keys(pattern);

    const jobs = [];
    for (const key of jobKeys) {
      const jobDataStr = await redis.get(key);
      if (jobDataStr) {
        const jobData = JSON.parse(jobDataStr);
        // Filter by user ID
        if (jobData.userId === userId) {
          jobs.push(jobData);
        }
      }
    }

    // Sort by creation time (newest first)
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to last 50 jobs
    const recentJobs = jobs.slice(0, 50);

    res.json({
      jobs: recentJobs,
      count: recentJobs.length,
      total: jobs.length
    });

  } catch (error) {
    winston.error('Failed to get user jobs', {
      userId: req.user.id,
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to retrieve jobs',
      message: 'An error occurred while fetching your jobs'
    });
  }
});

/**
 * GET /api/jobs/active
 * Get all active jobs (admin only)
 */
router.get('/active', authenticate, authorize(['IT Administrator']), async (req, res) => {
  try {
    const redis = getRedisClient();

    // Get all job keys
    const pattern = `job:*`;
    const jobKeys = await redis.keys(pattern);

    const activeJobs = [];
    for (const key of jobKeys) {
      const jobDataStr = await redis.get(key);
      if (jobDataStr) {
        const jobData = JSON.parse(jobDataStr);
        if (jobData.status === 'processing' || jobData.status === 'pending') {
          activeJobs.push(jobData);
        }
      }
    }

    // Also get active jobs from ML service
    try {
      const mlClient = getMLServiceClient();
      const mlResponse = await mlClient.get('/api/v1/jobs/active');
      activeJobs.push(...mlResponse.data.processing);
      activeJobs.push(...mlResponse.data.pending);
    } catch (mlError) {
      winston.warn('Failed to get active jobs from ML service', {
        error: mlError.message
      });
    }

    res.json({
      activeJobs,
      count: activeJobs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    winston.error('Failed to get active jobs', { error: error.message });

    res.status(500).json({
      error: 'Failed to retrieve active jobs',
      message: 'An error occurred while fetching active jobs'
    });
  }
});

/**
 * GET /api/jobs/stats
 * Get job statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const redis = getRedisClient();
    const userId = req.user.id;

    // Get all job keys
    const pattern = `job:*`;
    const jobKeys = await redis.keys(pattern);

    let totalJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;
    let processingJobs = 0;
    const jobsByStatus = {};

    for (const key of jobKeys) {
      const jobDataStr = await redis.get(key);
      if (jobDataStr) {
        const jobData = JSON.parse(jobDataStr);
        // Filter by user ID for non-admin users
        if (req.user.role !== 'IT Administrator' && jobData.userId !== userId) {
          continue;
        }

        totalJobs++;
        const status = jobData.status;

        if (!jobsByStatus[status]) {
          jobsByStatus[status] = 0;
        }
        jobsByStatus[status]++;

        if (status === 'completed') completedJobs++;
        else if (status === 'failed') failedJobs++;
        else if (status === 'processing') processingJobs++;
      }
    }

    // Get ML service metrics if admin
    let mlServiceStats = null;
    if (req.user.role === 'IT Administrator') {
      try {
        const mlClient = getMLServiceClient();
        const mlResponse = await mlClient.get('/metrics');
        mlServiceStats = mlResponse.data;
      } catch (mlError) {
        winston.warn('Failed to get ML service stats', {
          error: mlError.message
        });
      }
    }

    res.json({
      stats: {
        total: totalJobs,
        completed: completedJobs,
        failed: failedJobs,
        processing: processingJobs,
        byStatus: jobsByStatus
      },
      mlService: mlServiceStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    winston.error('Failed to get job stats', {
      userId: req.user.id,
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to retrieve job statistics',
      message: 'An error occurred while fetching job statistics'
    });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get specific job details
 */
router.get('/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const redis = getRedisClient();

    const jobDataStr = await redis.get(`job:${jobId}`);
    if (!jobDataStr) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID ${jobId}`
      });
    }

    const jobData = JSON.parse(jobDataStr);

    // Check if user owns this job or is admin
    if (req.user.role !== 'IT Administrator' && jobData.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this job'
      });
    }

    res.json(jobData);

  } catch (error) {
    winston.error('Failed to get job details', {
      jobId: req.params.jobId,
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to retrieve job details',
      message: 'An error occurred while fetching job details'
    });
  }
});

/**
 * DELETE /api/jobs/:jobId
 * Cancel a job
 */
router.delete('/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const redis = getRedisClient();

    const jobDataStr = await redis.get(`job:${jobId}`);
    if (!jobDataStr) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID ${jobId}`
      });
    }

    const jobData = JSON.parse(jobDataStr);

    // Check if user owns this job or is admin
    if (req.user.role !== 'IT Administrator' && jobData.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to cancel this job'
      });
    }

    // Check if job can be cancelled
    if (!['pending', 'processing'].includes(jobData.status)) {
      return res.status(400).json({
        error: 'Job cannot be cancelled',
        message: `Job status is ${jobData.status}. Only pending or processing jobs can be cancelled.`
      });
    }

    // Try to cancel in ML service if applicable
    if (jobData.mlJobId) {
      try {
        const mlClient = getMLServiceClient();
        await mlClient.delete(`/api/v1/job/${jobData.mlJobId}`);
      } catch (mlError) {
        winston.warn('Failed to cancel job in ML service', {
          jobId,
          mlJobId: jobData.mlJobId,
          error: mlError.message
        });
      }
    }

    // Update job status locally
    jobData.status = 'cancelled';
    jobData.updatedAt = new Date().toISOString();

    await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);

    res.json({
      message: 'Job cancelled successfully',
      jobId,
      status: 'cancelled'
    });

  } catch (error) {
    winston.error('Failed to cancel job', {
      jobId: req.params.jobId,
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to cancel job',
      message: 'An error occurred while cancelling the job'
    });
  }
});

/**
 * POST /api/jobs/:jobId/retry
 * Retry a failed job
 */
router.post('/:jobId/retry', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const redis = getRedisClient();

    const jobDataStr = await redis.get(`job:${jobId}`);
    if (!jobDataStr) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID ${jobId}`
      });
    }

    const jobData = JSON.parse(jobDataStr);

    // Check if user owns this job or is admin
    if (req.user.role !== 'IT Administrator' && jobData.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to retry this job'
      });
    }

    // Check if job can be retried
    if (jobData.status !== 'failed') {
      return res.status(400).json({
        error: 'Job cannot be retried',
        message: `Job status is ${jobData.status}. Only failed jobs can be retried.`
      });
    }

    // Try to retry in ML service if applicable
    if (jobData.mlJobId) {
      try {
        const mlClient = getMLServiceClient();
        await mlClient.post(`/api/v1/job/${jobData.mlJobId}/retry`);
      } catch (mlError) {
        winston.warn('Failed to retry job in ML service', {
          jobId,
          mlJobId: jobData.mlJobId,
          error: mlError.message
        });
      }
    }

    // Reset job status locally
    jobData.status = 'pending';
    jobData.error = null;
    jobData.progress = 0;
    jobData.updatedAt = new Date().toISOString();

    await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);

    res.json({
      message: 'Job retry initiated',
      jobId,
      status: 'pending'
    });

  } catch (error) {
    winston.error('Failed to retry job', {
      jobId: req.params.jobId,
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to retry job',
      message: 'An error occurred while retrying the job'
    });
  }
});

module.exports = router;
