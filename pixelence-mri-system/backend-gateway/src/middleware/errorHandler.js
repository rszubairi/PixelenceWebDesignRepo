/**
 * Error Handler Middleware
 * Centralized error handling for the API gateway
 */

const winston = require('winston');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  winston.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? { id: req.user.id, role: req.user.role } : null,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }

  // MongoDB/Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: 'Duplicate Error',
      message: `${field} already exists`,
      field: field,
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors (should be handled by auth middleware, but just in case)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'The provided authentication token is invalid',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Your authentication token has expired',
      timestamp: new Date().toISOString()
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'The uploaded file exceeds the maximum allowed size',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected File',
      message: 'Unexpected file field in upload',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected error occurred';

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    error: err.name || 'Internal Server Error',
    message: message,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && {
      stack: err.stack,
      details: err.details || err
    })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper utility
 * Wraps async route handlers to catch rejected promises
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error helper
 */
const createValidationError = (message, field = null) => {
  const error = new AppError(message, 400);
  error.field = field;
  return error;
};

/**
 * Not found error helper
 */
const createNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404);
};

/**
 * Forbidden error helper
 */
const createForbiddenError = (message = 'Access denied') => {
  return new AppError(message, 403);
};

/**
 * Unauthorized error helper
 */
const createUnauthorizedError = (message = 'Authentication required') => {
  return new AppError(message, 401);
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError,
  createUnauthorizedError
};
