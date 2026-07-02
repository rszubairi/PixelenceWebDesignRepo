# Multi-stage build for Gateway service
FROM node:18-alpine as base

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Gateway Service Stage
FROM base as gateway

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "src/server.js"]

# Development Stage
FROM base as development

# Install development dependencies
RUN npm install

# Copy application code
COPY . .

# Start in development mode
CMD ["npm", "run", "dev"]