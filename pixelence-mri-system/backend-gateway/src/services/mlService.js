/**
 * ML Service Client
 * Handles communication with the Python ML processing service
 */

const axios = require('axios');
const winston = require('winston');

let mlClient = null;
let mlServiceUrl = null;

/**
 * Initialize ML service client
 * @param {string} baseURL - Base URL of the ML service
 */
async function initMLService(baseURL) {
  mlServiceUrl = baseURL;

  mlClient = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds default timeout
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Pixelence-API-Gateway/1.0'
    }
  });

  // Add request interceptor for logging
  mlClient.interceptors.request.use(
    (config) => {
      winston.debug('ML Service Request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        timeout: config.timeout
      });
      return config;
    },
    (error) => {
      winston.error('ML Service Request Error', { error: error.message });
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging and error handling
  mlClient.interceptors.response.use(
    (response) => {
      winston.debug('ML Service Response', {
        status: response.status,
        url: response.config.url,
        duration: Date.now() - response.config.metadata?.startTime
      });
      return response;
    },
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url;

      winston.error('ML Service Response Error', {
        status,
        url,
        message: error.message,
        duration: Date.now() - error.config?.metadata?.startTime
      });

      // Handle specific error cases
      if (status === 503) {
        error.message = 'ML service is temporarily unavailable. Please try again later.';
      } else if (status === 504) {
        error.message = 'ML service request timed out. Please try again.';
      } else if (status >= 500) {
        error.message = 'ML service encountered an internal error. Please contact support.';
      }

      return Promise.reject(error);
    }
  );

  // Test connection
  try {
    await mlClient.get('/health');
    winston.info('ML Service connection established', { url: baseURL });
  } catch (error) {
    winston.warn('ML Service not available during initialization', {
      url: baseURL,
      error: error.message
    });
    // Don't throw error here - service might be starting up
  }
}

/**
 * Get the ML service client instance
 * @returns {axios.AxiosInstance} Configured axios client
 */
function getMLServiceClient() {
  if (!mlClient) {
    throw new Error('ML Service client not initialized. Call initMLService() first.');
  }
  return mlClient;
}

/**
 * Check ML service health
 * @returns {Promise<Object>} Health status
 */
async function checkMLServiceHealth() {
  try {
    const response = await mlClient.get('/health/detailed');
    return {
      status: 'healthy',
      details: response.data
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Get ML service metrics
 * @returns {Promise<Object>} Service metrics
 */
async function getMLServiceMetrics() {
  try {
    const response = await mlClient.get('/metrics');
    return response.data;
  } catch (error) {
    winston.warn('Failed to get ML service metrics', { error: error.message });
    return {
      error: 'Metrics unavailable',
      message: error.message
    };
  }
}

/**
 * Submit DICOM processing job to ML service
 * @param {FormData} formData - Form data with DICOM files
 * @param {string} jobId - Job ID for tracking
 * @returns {Promise<Object>} Job submission response
 */
async function submitDICOMJob(formData, jobId) {
  const response = await mlClient.post('/api/v1/process-dicom', formData, {
    headers: {
      ...formData.getHeaders(),
    },
    timeout: 60000, // 60 seconds for file upload
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    metadata: { startTime: Date.now() }
  });

  return response.data;
}

/**
 * Get job status from ML service
 * @param {string} mlJobId - ML service job ID
 * @returns {Promise<Object>} Job status
 */
async function getJobStatus(mlJobId) {
  const response = await mlClient.get(`/api/v1/job/${mlJobId}/status`);
  return response.data;
}

/**
 * Get job results from ML service
 * @param {string} mlJobId - ML service job ID
 * @returns {Promise<Object>} Job results
 */
async function getJobResults(mlJobId) {
  const response = await mlClient.get(`/api/v1/job/${mlJobId}/results`);
  return response.data;
}

/**
 * Cancel job in ML service
 * @param {string} mlJobId - ML service job ID
 * @returns {Promise<Object>} Cancellation response
 */
async function cancelJob(mlJobId) {
  const response = await mlClient.delete(`/api/v1/job/${mlJobId}`);
  return response.data;
}

/**
 * Get active jobs from ML service
 * @returns {Promise<Object>} Active jobs
 */
async function getActiveJobs() {
  const response = await mlClient.get('/api/v1/jobs/active');
  return response.data;
}

/**
 * Get failed jobs from ML service
 * @returns {Promise<Object>} Failed jobs
 */
async function getFailedJobs() {
  const response = await mlClient.get('/api/v1/jobs/failed');
  return response.data;
}

/**
 * Retry failed job in ML service
 * @param {string} mlJobId - ML service job ID
 * @returns {Promise<Object>} Retry response
 */
async function retryJob(mlJobId) {
  const response = await mlClient.post(`/api/v1/job/${mlJobId}/retry`);
  return response.data;
}

module.exports = {
  initMLService,
  getMLServiceClient,
  checkMLServiceHealth,
  getMLServiceMetrics,
  submitDICOMJob,
  getJobStatus,
  getJobResults,
  cancelJob,
  getActiveJobs,
  getFailedJobs,
  retryJob
};
