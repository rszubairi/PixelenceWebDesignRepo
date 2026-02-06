/**
 * Request Logging Middleware
 * Logs HTTP requests and responses for monitoring and debugging
 */

const winston = require('winston');

/**
 * Request logging middleware
 * Logs incoming requests with relevant details
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log the incoming request
  winston.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.method !== 'GET' && req.body ? '[REDACTED]' : undefined,
    user: req.user ? { id: req.user.id, role: req.user.role } : undefined
  });

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;

    winston.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      user: req.user ? { id: req.user.id, role: req.user.role } : undefined
    });

    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Performance logging middleware
 * Logs slow requests for performance monitoring
 */
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      if (duration > threshold) {
        winston.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          statusCode: res.statusCode,
          user: req.user ? { id: req.user.id, role: req.user.role } : undefined
        });
      }
    });

    next();
  };
};

/**
 * Security logging middleware
 * Logs security-related events
 */
const securityLogger = (req, res, next) => {
  // Log failed authentication attempts
  if (res.statusCode === 401) {
    winston.warn('Authentication failed', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode
    });
  }

  // Log access to sensitive endpoints
  const sensitiveEndpoints = ['/api/auth', '/api/dicom/upload'];
  if (sensitiveEndpoints.some(endpoint => req.originalUrl.includes(endpoint))) {
    winston.info('Access to sensitive endpoint', {
      method: req.method,
      url: req.originalUrl,
      user: req.user ? { id: req.user.id, role: req.user.role } : 'unauthenticated',
      ip: req.ip
    });
  }

  next();
};

/**
 * Error logging middleware
 * Logs errors with context
 */
const errorLogger = (err, req, res, next) => {
  winston.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params
  });

  next(err);
};

module.exports = {
  requestLogger,
  performanceLogger,
  securityLogger,
  errorLogger
};
