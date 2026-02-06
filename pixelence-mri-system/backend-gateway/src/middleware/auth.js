/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const winston = require('winston');

/**
 * JWT Secret - In production, this should be from environment variables
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

/**
 * Authenticate middleware - validates JWT tokens
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Authorization header is missing'
      });
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Authorization header must start with "Bearer "'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        error: 'Token missing',
        message: 'JWT token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      hospital: decoded.hospital
    };

    winston.debug('User authenticated', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    next();

  } catch (error) {
    winston.warn('Authentication failed', {
      error: error.message,
      tokenPresent: !!req.headers.authorization
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or malformed.'
      });
    } else {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to authenticate the request.'
      });
    }
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 * Useful for endpoints that work with or without authentication
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      hospital: decoded.hospital
    };

    winston.debug('Optional authentication successful', {
      userId: req.user.id,
      email: req.user.email
    });

  } catch (error) {
    // For optional auth, we don't fail on errors
    winston.debug('Optional authentication failed, continuing without user', {
      error: error.message
    });
    req.user = null;
  }

  next();
};

/**
 * Role-based authorization middleware factory
 * @param {string[]} allowedRoles - Array of roles that can access the endpoint
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      winston.warn('Access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        error: 'Access denied',
        message: `Your role (${req.user.role}) does not have permission to access this resource`,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Generate JWT token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    hospital: payload.hospital,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(tokenPayload, JWT_SECRET);
};

/**
 * Verify JWT token (utility function)
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  generateToken,
  verifyToken,
  JWT_SECRET
};
