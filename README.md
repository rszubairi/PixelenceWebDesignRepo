# Pixelence ML Service AWS Deployment

This repository contains the complete setup for deploying the Pixelence ML Service on AWS with Amplify integration.

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PixelenceWebDesignRepo
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the services**
   - Frontend: http://localhost:3000
   - Gateway API: http://localhost:3001
   - ML Service: http://localhost:8000

### AWS Deployment

See [AWS Deployment Guide](./aws-deployment-guide.md) for detailed instructions on deploying to AWS using ECS Fargate or EC2 instances.

## Architecture Overview

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

## Services

### ML Service (FastAPI)
- **Port**: 8000
- **Purpose**: AI-powered DICOM image processing
- **Features**: Model inference, job management, health monitoring

### Gateway Service (Node.js)
- **Port**: 3001
- **Purpose**: API gateway and authentication
- **Features**: File upload handling, Redis integration, ML service communication

### Frontend (Next.js)
- **Port**: 3000
- **Purpose**: User interface for medical imaging
- **Features**: DICOM viewer, job management, user authentication

## Configuration

### Environment Variables

#### ML Service
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
API_HOST=0.0.0.0
API_PORT=8000
MODEL_PATH=./models
MAX_CONCURRENT_JOBS=3
JOB_TIMEOUT_SECONDS=3600
```

#### Gateway Service
```bash
ML_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONVEX_URL=https://your-convex-app.convex.cloud
```

## AWS Deployment Options

### Option 1: ECS Fargate (Recommended)
- **Pros**: Serverless, auto-scaling, managed infrastructure
- **Cons**: Higher cost, cold starts
- **Best for**: Production workloads with variable traffic

### Option 2: EC2 Instances
- **Pros**: Lower cost, full control, persistent instances
- **Cons**: Manual scaling, server management required
- **Best for**: Predictable workloads, cost-sensitive deployments

## Monitoring and Logging

### Health Checks
All services include health check endpoints:
- ML Service: `GET /health`
- Gateway: `GET /health`
- Frontend: `GET /` (root endpoint)

### Metrics
- CPU and memory usage
- Request/response times
- Error rates
- Job processing metrics

### Logging
- Structured logging with Winston (Node.js)
- Structured logging with structlog (Python)
- CloudWatch integration for AWS deployments

## Security

### Best Practices Implemented
- IAM roles with least privilege
- Security groups with restricted access
- Secrets Manager for sensitive configuration
- VPC deployment in private subnets
- Encryption at rest and in transit

### Authentication
- JWT-based authentication
- Role-based access control
- Secure password hashing with bcrypt

## Troubleshooting

### Common Issues

1. **Container Health Checks Failing**
   - Check Redis connectivity
   - Verify environment variables
   - Review application logs

2. **High Memory Usage**
   - Adjust batch size in ML service
   - Monitor model loading
   - Check for memory leaks

3. **Timeout Issues**
   - Increase timeout settings
   - Check network connectivity
   - Monitor Redis performance

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart services
docker-compose restart

# Scale services
docker-compose up --scale ml-service=3
```

## Development

### Adding New Features

1. **ML Service**: Add new endpoints in `backend-ml/app/api/routes/`
2. **Gateway**: Add new routes in `pixelence-mri-system/backend-gateway/src/routes/`
3. **Frontend**: Add new pages in `pixelence-mri-system/pages/`

### Testing

```bash
# Run tests
npm test  # For Node.js services
pytest    # For Python services

# Run linting
npm run lint
black --check .  # For Python
```

## Cost Optimization

### ECS Fargate
- Use Fargate Spot for non-critical workloads
- Implement auto-scaling based on CPU/memory
- Set appropriate resource limits

### EC2
- Use spot instances for cost savings
- Implement auto-scaling groups
- Use appropriate instance types

### General
- Enable CloudWatch log retention
- Use S3 lifecycle policies for old files
- Monitor and optimize Redis usage

## Support

For issues and questions:
1. Check the [AWS Deployment Guide](./aws-deployment-guide.md)
2. Review the troubleshooting section
3. Check service logs for error details
4. Verify environment configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.