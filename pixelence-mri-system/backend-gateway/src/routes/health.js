/**
 * Health Check Routes
 * Provides health status and monitoring endpoints
 */

const express = require('express');
const winston = require('winston');

const router = express.Router();

// Import services
const { checkRedisHealth } = require('../services/redis');
const { checkMLServiceHealth, getMLServiceMetrics } = require('../services/mlService');

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Pixelence API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/detailed
 * Comprehensive health check with component status
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'Pixelence API Gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      components: {}
    };

    // Check Redis health
    try {
      health.components.redis = await checkRedisHealth();
    } catch (error) {
      health.components.redis = {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
      health.status = 'degraded';
    }

    // Check ML Service health
    try {
      health.components.mlService = await checkMLServiceHealth();
    } catch (error) {
      health.components.mlService = {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
      health.status = 'degraded';
    }

    // Check system resources
    const memUsage = process.memoryUsage();
    health.system = {
      memory: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    // If any component is unhealthy, mark overall status as unhealthy
    const unhealthyComponents = Object.values(health.components).filter(
      comp => comp.status === 'error' || comp.status === 'unhealthy'
    );

    if (unhealthyComponents.length > 0) {
      health.status = 'unhealthy';
      res.status(503);
    }

    res.json(health);

  } catch (error) {
    winston.error('Detailed health check failed', { error: error.message });

    res.status(503).json({
      status: 'unhealthy',
      service: 'Pixelence API Gateway',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies
    const redisHealth = await checkRedisHealth();

    if (redisHealth.status !== 'connected') {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Redis unavailable',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    winston.error('Readiness check failed', { error: error.message });

    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/metrics
 * Service metrics and statistics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      service: 'Pixelence API Gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      components: {}
    };

    // Redis metrics
    try {
      metrics.components.redis = await checkRedisHealth();
    } catch (error) {
      metrics.components.redis = { error: error.message };
    }

    // ML Service metrics
    try {
      metrics.components.mlService = await getMLServiceMetrics();
    } catch (error) {
      metrics.components.mlService = { error: error.message };
    }

    res.json(metrics);

  } catch (error) {
    winston.error('Metrics endpoint failed', { error: error.message });

    res.status(500).json({
      error: 'Metrics unavailable',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
