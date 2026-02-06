/**
 * Redis Service
 * Handles Redis connection and operations
 */

const redis = require('redis');
const winston = require('winston');

let redisClient = null;

/**
 * Initialize Redis connection
 * @param {string} redisUrl - Redis connection URL
 */
async function initRedis(redisUrl) {
  try {
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 60000,
        lazyConnect: true,
      },
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          winston.error('Redis connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          winston.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          winston.error('Redis max retry attempts reached');
          return new Error('Max retry attempts reached');
        }
        // Exponential backoff
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Event handlers
    redisClient.on('error', (err) => {
      winston.error('Redis Client Error', { error: err.message });
    });

    redisClient.on('connect', () => {
      winston.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      winston.info('Redis client ready');
    });

    redisClient.on('end', () => {
      winston.info('Redis client disconnected');
    });

    // Connect to Redis
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    winston.info('Redis connection established', { url: redisUrl });

  } catch (error) {
    winston.error('Failed to initialize Redis', { error: error.message });
    throw error;
  }
}

/**
 * Get Redis client instance
 * @returns {redis.RedisClient} Redis client
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      winston.info('Redis connection closed');
    } catch (error) {
      winston.error('Error closing Redis connection', { error: error.message });
    }
  }
}

/**
 * Health check for Redis
 * @returns {Promise<Object>} Health status
 */
async function checkRedisHealth() {
  try {
    if (!redisClient) {
      return { status: 'disconnected' };
    }

    const ping = await redisClient.ping();
    const info = await redisClient.info();

    // Parse some basic info
    const infoLines = info.split('\n');
    const parsedInfo = {};
    infoLines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsedInfo[key] = value;
      }
    });

    return {
      status: 'connected',
      ping: ping === 'PONG',
      version: parsedInfo.redis_version,
      uptime: parsedInfo.uptime_in_seconds,
      connected_clients: parsedInfo.connected_clients,
      used_memory: parsedInfo.used_memory_human,
      total_connections_received: parsedInfo.total_connections_received
    };
  } catch (error) {
    winston.error('Redis health check failed', { error: error.message });
    return {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
  checkRedisHealth
};
