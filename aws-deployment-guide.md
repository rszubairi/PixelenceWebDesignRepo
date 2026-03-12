# AWS Deployment Guide for Pixelence ML Service

## Overview

This guide provides step-by-step instructions for hosting the ML service on AWS and connecting it to an EC2 instance with Amplify endpoint for integration with incoming requests.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Amplify App   │───▶│   EC2 Instance   │───▶│   ML Service    │
│   (Frontend)    │    │   (Gateway)      │    │   (FastAPI)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │     Redis        │
                       │   (ElasticCache) │
                       └──────────────────┘
```

## Prerequisites

- AWS CLI installed and configured
- Docker installed locally
- Basic knowledge of AWS services
- Existing Amplify application

## Option 1: AWS ECS Fargate (Recommended)

### Step 1: Create ECR Repository

```bash
# Create ECR repository for ML service
aws ecr create-repository --repository-name pixelence-ml-service --region us-east-1

# Get login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Create Dockerfile for ML Service

```dockerfile
# backend-ml/Dockerfile
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads results models

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 3: Build and Push Docker Image

```bash
# Build Docker image
docker build -t pixelence-ml-service:latest .

# Tag image for ECR
docker tag pixelence-ml-service:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pixelence-ml-service:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pixelence-ml-service:latest
```

### Step 4: Create ECS Task Definition

```json
{
  "family": "pixelence-ml-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "ml-service",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pixelence-ml-service:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "REDIS_HOST",
          "value": "your-redis-cluster.cache.amazonaws.com"
        },
        {
          "name": "REDIS_PORT",
          "value": "6379"
        },
        {
          "name": "API_HOST",
          "value": "0.0.0.0"
        },
        {
          "name": "API_PORT",
          "value": "8000"
        }
      ],
      "secrets": [
        {
          "name": "REDIS_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:pixelence/redis-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pixelence-ml-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Step 5: Create ECS Service

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster pixelence-cluster \
  --service-name ml-service \
  --task-definition pixelence-ml-service \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

### Step 6: Create Application Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name pixelence-ml-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-12345 \
  --target-type ip

# Create ALB
aws elbv2 create-load-balancer \
  --name pixelence-ml-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:YOUR_ACCOUNT_ID:loadbalancer/app/pixelence-ml-alb/12345 \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:YOUR_ACCOUNT_ID:targetgroup/pixelence-ml-tg/12345
```

## Option 2: EC2 Instance Deployment

### Step 1: Launch EC2 Instance

```bash
# Create security group
aws ec2 create-security-group \
  --group-name pixelence-ml-sg \
  --description "Security group for ML service"

# Authorize ports
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345 \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-12345 \
  --protocol tcp \
  --port 8000 \
  --source-group sg-67890  # Gateway security group
```

### Step 2: User Data Script for EC2

```bash
#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/pixelence-ml
cd /opt/pixelence-ml

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  ml-service:
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pixelence-ml-service:latest
    ports:
      - "8000:8000"
    environment:
      - REDIS_HOST=your-redis-cluster.cache.amazonaws.com
      - REDIS_PORT=6379
      - API_HOST=0.0.0.0
      - API_PORT=8000
    secrets:
      - redis_password
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

secrets:
  redis_password:
    external: true
    name: pixelence/redis-password
EOF

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Start service
docker-compose up -d
```

## Redis Setup (ElasticCache)

### Step 1: Create Redis Cluster

```bash
aws elasticache create-replication-group \
  --replication-group-id pixelence-redis \
  --replication-group-description "Redis cluster for Pixelence ML service" \
  --engine redis \
  --engine-version 6.2 \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 1 \
  --automatic-failover-enabled \
  --security-group-ids sg-12345 \
  --preferred-cache-cluster-azs us-east-1a
```

### Step 2: Store Redis Password in Secrets Manager

```bash
aws secretsmanager create-secret \
  --name pixelence/redis-password \
  --description "Redis password for Pixelence ML service" \
  --secret-string "your-redis-password"
```

## Gateway Configuration Update

### Update Environment Variables

```bash
# Update ML_SERVICE_URL in gateway
export ML_SERVICE_URL="http://your-alb-dns-name:8000"
# or for EC2
export ML_SERVICE_URL="http://your-ec2-public-ip:8000"
```

### Update Gateway Docker Compose

```yaml
# pixelence-mri-system/backend-gateway/docker-compose.yml
version: '3.8'
services:
  gateway:
    build: .
    ports:
      - "3001:3001"
    environment:
      - ML_SERVICE_URL=http://ml-service:8000
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

## Amplify Integration

### Step 1: Update Amplify Backend Configuration

```javascript
// amplify/backend/backend-config.json
{
  "api": {
    "pixelenceapi": {
      "service": "API Gateway",
      "providerPlugin": "awscloudformation",
      "dependsOn": [
        {
          "category": "function",
          "resourceName": "pixelenceapi",
          "attributes": [
            "ApiName",
            "RootUrl"
          ]
        }
      ]
    }
  },
  "function": {
    "pixelenceapi": {
      "build": true,
      "providerPlugin": "awscloudformation"
    }
  }
}
```

### Step 2: Create API Gateway Integration

```javascript
// amplify/backend/function/pixelenceapi/src/app.js
const axios = require('axios');

exports.handler = async (event) => {
  const mlServiceUrl = process.env.ML_SERVICE_URL;
  
  try {
    const response = await axios({
      method: event.httpMethod,
      url: `${mlServiceUrl}${event.path}`,
      headers: event.headers,
      data: event.body,
      params: event.queryStringParameters
    });
    
    return {
      statusCode: response.status,
      headers: response.headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data
      })
    };
  }
};
```

### Step 3: Environment Variables in Amplify

```bash
# In Amplify console or CLI
amplify update function
# Select your function
# Add environment variable: ML_SERVICE_URL=http://your-alb-dns-name:8000
```

## Monitoring and Logging

### CloudWatch Logs

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/pixelence-ml-service

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/pixelence-ml-service \
  --retention-in-days 30
```

### CloudWatch Metrics

```bash
# Enable detailed monitoring for EC2
aws ec2 monitor-instances --instance-ids i-1234567890abcdef0

# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name ml-service-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:pixelence-alerts
```

## Cost Optimization

### ECS Fargate Spot

```json
{
  "capacityProviderStrategy": [
    {
      "capacityProvider": "FARGATE_SPOT",
      "weight": 1,
      "base": 0
    }
  ]
}
```

### Auto Scaling

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/pixelence-cluster/ml-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10
```

## Security Best Practices

1. **IAM Roles**: Use least privilege principle for ECS task roles
2. **Security Groups**: Restrict access to necessary ports only
3. **Secrets Manager**: Store all sensitive configuration
4. **VPC**: Deploy in private subnets with NAT gateway
5. **Encryption**: Enable encryption at rest and in transit

## Troubleshooting

### Common Issues

1. **Container Health Checks Failing**: Check Redis connectivity
2. **High Memory Usage**: Adjust batch size and model loading
3. **Timeout Issues**: Increase timeout settings in gateway
4. **Permission Errors**: Verify IAM roles and policies

### Debug Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster pixelence-cluster --services ml-service

# Check task logs
aws logs tail /ecs/pixelence-ml-service --follow

# Test Redis connection
redis-cli -h your-redis-cluster.cache.amazonaws.com -p 6379 ping
```

## Next Steps

1. Set up CI/CD pipeline with CodePipeline
2. Configure backup strategies for Redis
3. Implement blue/green deployments
4. Set up comprehensive monitoring dashboards
5. Configure disaster recovery procedures