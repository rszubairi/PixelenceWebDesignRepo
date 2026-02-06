/**
 * Pixelence API Gateway Server
 * Handles authentication, file uploads, and communication with ML service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const winston = require('winston');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const dicomRoutes = require('./routes/dicom');
const jobsRoutes = require('./routes/jobs');
const healthRoutes = require('./routes/health');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logging');

// Import services
const { initRedis } = require('./services/redis');
const { initMLService } = require('./services/mlService');

// Configuration
const config = {
  port: process.env.PORT || 3001,
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') :
    ['http://localhost:3000', 'http://127.0.0.1:3000']
};

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: config.maxFileSize
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../temp')
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check (no auth required)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dicom', dicomRoutes);
app.use('/api/jobs', jobsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Pixelence API Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      dicom: '/api/dicom',
      jobs: '/api/jobs',
      health: '/health'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  winston.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  winston.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize services
    await initRedis(config.redisUrl);
    await initMLService(config.mlServiceUrl);

    // Start HTTP server
    app.listen(config.port, () => {
      winston.info(`Pixelence API Gateway running on port ${config.port}`);
      winston.info(`ML Service URL: ${config.mlServiceUrl}`);
      winston.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    winston.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize server
startServer().catch(error => {
  winston.error('Server initialization failed:', error);
  process.exit(1);
});

module.exports = app;
