/**
 * DICOM Processing Routes
 * Handles DICOM file uploads and forwards to ML service
 */

const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const router = express.Router();

// Import middleware
const { authenticate } = require('../middleware/auth');

// Import services
const { getRedisClient } = require('../services/redis');
const { getMLServiceClient } = require('../services/mlService');

// File type validation
const ALLOWED_EXTENSIONS = ['.dcm', '.dicom'];
const MAX_FILES = 10;

/**
 * POST /api/dicom/upload
 * Upload DICOM files for processing
 */
router.post('/upload', authenticate, async (req, res) => {
  try {
    winston.info('DICOM upload request received', {
      userId: req.user?.id,
      filesCount: req.files ? Object.keys(req.files).length : 0
    });

    // Validate request
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please upload at least one DICOM file'
      });
    }

    const files = req.files.dicom || req.files.files || Object.values(req.files).flat();
    const fileArray = Array.isArray(files) ? files : [files];

    // Validate file count
    if (fileArray.length > MAX_FILES) {
      return res.status(400).json({
        error: 'Too many files',
        message: `Maximum ${MAX_FILES} files allowed`
      });
    }

    // Validate file types
    for (const file of fileArray) {
      const extension = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File ${file.name} is not a valid DICOM file. Only .dcm and .dicom files are allowed.`
        });
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        return res.status(400).json({
          error: 'File too large',
          message: `File ${file.name} exceeds maximum size of 100MB`
        });
      }
    }

    // Generate job ID
    const jobId = uuidv4();

    // Store file metadata in Redis for tracking
    const redis = getRedisClient();
    const jobData = {
      jobId,
      userId: req.user?.id,
      fileCount: fileArray.length,
      fileNames: fileArray.map(f => f.name),
      status: 'uploading',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400); // 24 hours

    // Prepare form data for ML service
    const formData = new FormData();

    fileArray.forEach((file, index) => {
      formData.append('files', file.data, {
        filename: file.name,
        contentType: file.mimetype || 'application/octet-stream'
      });
    });

    // Add job ID to form data
    formData.append('job_id', jobId);

    // Update progress
    jobData.status = 'processing';
    jobData.progress = 10;
    await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);

    // Forward to ML service asynchronously
    setImmediate(async () => {
      try {
        const mlClient = getMLServiceClient();
        const response = await mlClient.post('/api/v1/process-dicom', formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': req.headers.authorization
          },
          timeout: 60000, // 60 seconds
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        // Update job data with ML service response
        jobData.status = 'processing';
        jobData.mlJobId = response.data.job_id;
        jobData.progress = 20;
        jobData.estimatedTime = response.data.estimated_time;

        await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);

        winston.info('DICOM files forwarded to ML service', {
          jobId,
          mlJobId: response.data.job_id,
          fileCount: fileArray.length
        });

      } catch (error) {
        winston.error('Failed to forward to ML service', {
          jobId,
          error: error.message,
          status: error.response?.status
        });

        // Update job status to failed
        jobData.status = 'failed';
        jobData.error = 'Failed to process files';
        jobData.details = error.message;
        await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);
      }
    });

    // Return immediate response
    res.json({
      jobId,
      status: 'processing',
      message: 'DICOM files uploaded successfully. Processing started.',
      fileCount: fileArray.length,
      estimatedTime: `${fileArray.length * 30}s`,
      progress: 10
    });

  } catch (error) {
    winston.error('DICOM upload error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Upload failed',
      message: 'An error occurred while processing your upload'
    });
  }
});

/**
 * GET /api/dicom/job/:jobId/status
 * Get processing status for a job
 */
router.get('/job/:jobId/status', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const redis = getRedisClient();

    // Get job data from Redis
    const jobDataStr = await redis.get(`job:${jobId}`);
    if (!jobDataStr) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID ${jobId}`
      });
    }

    const jobData = JSON.parse(jobDataStr);

    // Check if user owns this job
    if (jobData.userId && jobData.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this job'
      });
    }

    // If we have an ML job ID, check status from ML service
    if (jobData.mlJobId) {
      try {
        const mlClient = getMLServiceClient();
        const mlResponse = await mlClient.get(`/api/v1/job/${jobData.mlJobId}/status`);

        // Update local job data with ML service status
        jobData.status = mlResponse.data.status;
        jobData.progress = mlResponse.data.progress || jobData.progress;
        jobData.updatedAt = new Date().toISOString();

        // If completed, store results
        if (mlResponse.data.status === 'completed') {
          jobData.result = mlResponse.data.result;
        } else if (mlResponse.data.status === 'failed') {
          jobData.error = mlResponse.data.error;
        }

        // Update Redis
        await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);

      } catch (mlError) {
        winston.warn('Failed to get status from ML service', {
          jobId,
          mlJobId: jobData.mlJobId,
          error: mlError.message
        });
        // Continue with local status
      }
    }

    res.json({
      jobId: jobData.jobId,
      status: jobData.status,
      progress: jobData.progress,
      createdAt: jobData.createdAt,
      updatedAt: jobData.updatedAt,
      fileCount: jobData.fileCount,
      fileNames: jobData.fileNames,
      result: jobData.result,
      error: jobData.error,
      estimatedTime: jobData.estimatedTime
    });

  } catch (error) {
    winston.error('Error getting job status', {
      jobId: req.params.jobId,
      error: error.message
    });

    res.status(500).json({
      error: 'Status check failed',
      message: 'An error occurred while checking job status'
    });
  }
});

/**
 * GET /api/dicom/job/:jobId/results
 * Get processing results for a completed job
 */
router.get('/job/:jobId/results', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const redis = getRedisClient();

    // Get job data from Redis
    const jobDataStr = await redis.get(`job:${jobId}`);
    if (!jobDataStr) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID ${jobId}`
      });
    }

    const jobData = JSON.parse(jobDataStr);

    // Check if user owns this job
    if (jobData.userId && jobData.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this job'
      });
    }

    // Check if job is completed
    if (jobData.status !== 'completed') {
      return res.status(400).json({
        error: 'Job not completed',
        message: `Job status is ${jobData.status}. Results are not yet available.`
      });
    }

    // If we don't have results locally but have ML job ID, fetch from ML service
    if (!jobData.result && jobData.mlJobId) {
      try {
        const mlClient = getMLServiceClient();
        const mlResponse = await mlClient.get(`/api/v1/job/${jobData.mlJobId}/results`);

        jobData.result = mlResponse.data;
        await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);

      } catch (mlError) {
        winston.error('Failed to get results from ML service', {
          jobId,
          mlJobId: jobData.mlJobId,
          error: mlError.message
        });

        return res.status(500).json({
          error: 'Results unavailable',
          message: 'Failed to retrieve processing results'
        });
      }
    }

    res.json(jobData.result);

  } catch (error) {
    winston.error('Error getting job results', {
      jobId: req.params.jobId,
      error: error.message
    });

    res.status(500).json({
      error: 'Results retrieval failed',
      message: 'An error occurred while retrieving job results'
    });
  }
});

/**
 * DELETE /api/dicom/job/:jobId
 * Cancel a processing job
 */
router.delete('/job/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const redis = getRedisClient();

    // Get job data from Redis
    const jobDataStr = await redis.get(`job:${jobId}`);
    if (!jobDataStr) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No job found with ID ${jobId}`
      });
    }

    const jobData = JSON.parse(jobDataStr);

    // Check if user owns this job
    if (jobData.userId && jobData.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to cancel this job'
      });
    }

    // Try to cancel in ML service if possible
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

    // Update local job status
    jobData.status = 'cancelled';
    jobData.updatedAt = new Date().toISOString();

    await redis.set(`job:${jobId}`, JSON.stringify(jobData), 'EX', 86400);

    res.json({
      message: 'Job cancelled successfully',
      jobId
    });

  } catch (error) {
    winston.error('Error cancelling job', {
      jobId: req.params.jobId,
      error: error.message
    });

    res.status(500).json({
      error: 'Cancellation failed',
      message: 'An error occurred while cancelling the job'
    });
  }
});

module.exports = router;
