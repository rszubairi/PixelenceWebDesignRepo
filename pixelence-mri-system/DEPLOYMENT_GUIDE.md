# AWS Deployment Guide for Pixelence MRI System

## Overview
This guide covers deploying your Next.js application to AWS, with a focus on AWS App Runner and cost-effective alternatives.

---

## Option 1: AWS App Runner (Recommended for Simplicity)

### ✅ Pros
- Fully managed service
- Auto-scaling
- Simple deployment from GitHub/ECR
- Built-in load balancing
- HTTPS included

### 💰 Cost Estimate
- **$0.007/vCPU-hour + $0.0008/GB-hour**
- **Typical cost:** $10-30/month for small apps
- Free tier: No free tier available

### 📋 Prerequisites
1. AWS Account
2. GitHub repository with your code
3. Dockerfile (provided below)

### Step-by-Step Deployment

#### 1. Create Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Multi-stage build for smaller image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Next.js app
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
```

#### 2. Update next.config.js

Add this to your `next.config.js`:

```javascript
module.exports = {
  output: 'standalone', // Required for Docker deployment
  // ... other config
}
```

#### 3. Deploy to AWS App Runner

**Option A: Deploy from GitHub (Recommended)**

1. Go to AWS Console → App Runner
2. Click "Create service"
3. Choose "Source code repository"
4. Connect your GitHub account
5. Select your repository and branch
6. Configure build:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Port: `3000`
7. Set environment variables:
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex URL
   - `NODE_ENV`: production
8. Click "Create & deploy"

**Option B: Deploy from ECR (More control)**

1. Build Docker image:
```bash
docker build -t pixelence-mri-system .
```

2. Push to Amazon ECR:
```bash
# Create ECR repository
aws ecr create-repository --repository-name pixelence-mri-system

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag pixelence-mri-system:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pixelence-mri-system:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pixelence-mri-system:latest
```

3. Create App Runner service from ECR image

---

## Option 2: AWS Amplify Hosting (Best Value for Next.js)

### ✅ Pros
- **Built specifically for Next.js**
- Auto-deploys from Git
- Global CDN included
- Custom domains with free SSL
- **Better Next.js support than App Runner**

### 💰 Cost Estimate
- **FREE TIER: 1000 build minutes/month + 15GB served/month**
- **After free tier:** $0.01/build minute + $0.15/GB served
- **Typical cost:** $0-15/month for small apps
- **MOST AFFORDABLE OPTION**

### 📋 Deployment Steps

1. Go to AWS Console → AWS Amplify
2. Click "New app" → "Host web app"
3. Connect your GitHub/GitLab repository
4. Select branch (main/master)
5. Amplify auto-detects Next.js - use default settings
6. Add environment variables:
   ```
   NEXT_PUBLIC_CONVEX_URL=your-convex-url
   ```
7. Click "Save and deploy"

**Done!** Amplify will:
- Build your app
- Deploy to global CDN
- Auto-deploy on every Git push
- Provide a URL (e.g., https://main.d111111abcdef.amplifyapp.com)

---

## Option 3: Vercel (Recommended Alternative - Outside AWS)

### ✅ Pros
- **Made by Next.js creators**
- **Best Next.js support**
- Zero configuration
- Automatic optimizations
- Free tier is generous

### 💰 Cost Estimate
- **FREE TIER: Unlimited personal projects**
- **Pro:** $20/month per user
- **Typical cost:** FREE for development/testing

### 📋 Deployment Steps

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repository
5. Add environment variable:
   ```
   NEXT_PUBLIC_CONVEX_URL=your-convex-url
   ```
6. Click "Deploy"

**Note:** While not AWS, Vercel is often the best choice for Next.js apps.

---

## Cost Comparison

| Service | Monthly Cost | Free Tier | Best For |
|---------|-------------|-----------|----------|
| **AWS Amplify** | $0-15 | ✅ Generous | Next.js apps |
| **AWS App Runner** | $10-30 | ❌ None | Containerized apps |
| **Vercel** | FREE | ✅ Unlimited | Next.js (best) |
| **AWS Elastic Beanstalk** | $15-40 | ❌ Limited | Full control |
| **AWS ECS Fargate** | $20-50 | ❌ None | Enterprise |

---

## 🏆 Our Recommendation

### For Your Use Case (Pixelence MRI System):

**1st Choice: AWS Amplify** ✨
- **Why:** Best value, generous free tier, built for Next.js
- **Cost:** FREE to start, scales affordably
- **Setup time:** 10 minutes

**2nd Choice: Vercel** (if AWS not required)
- **Why:** Best Next.js support, completely free for development
- **Cost:** FREE
- **Setup time:** 5 minutes

**3rd Choice: AWS App Runner**
- **Why:** If you need more control over containerization
- **Cost:** $10-30/month
- **Setup time:** 20 minutes

---

## Environment Variables Setup

For any deployment option, you'll need:

```bash
# Required
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Optional
NODE_ENV=production
```

---

## Post-Deployment Checklist

- [ ] Update Convex CORS settings to allow your domain
- [ ] Set up custom domain (if needed)
- [ ] Configure SSL certificate (most services include this)
- [ ] Test all authentication flows
- [ ] Test sample user login
- [ ] Verify database connections
- [ ] Set up monitoring/logging
- [ ] Configure auto-scaling (if using App Runner/ECS)

---

## Monitoring & Costs

### AWS CloudWatch (Included)
- Monitor application logs
- Track performance metrics
- Set up alarms for errors

### Cost Optimization Tips
1. Use AWS Amplify free tier first
2. Enable auto-scaling to match traffic
3. Use CloudFront CDN for static assets
4. Implement proper caching strategies
5. Monitor your AWS billing dashboard

---

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Ensure next.config.js has:
output: 'standalone'  // For Docker deployments
```

**Environment Variables Not Working:**
- Prefix with `NEXT_PUBLIC_` for client-side access
- Rebuild/redeploy after adding variables

**CORS Errors:**
- Add your domain to Convex allowed origins
- Check Convex dashboard → Settings → CORS

---

## CI/CD Pipeline (Optional)

For automated deployments with AWS App Runner:

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS App Runner

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: pixelence-mri-system
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

---

## Quick Start Guide

### For AWS Amplify (Easiest & Cheapest):

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to AWS Console
# 3. Navigate to AWS Amplify
# 4. Click "New app" → "Host web app"
# 5. Connect GitHub → Select repo → Deploy

# Total time: 10 minutes
# Cost: FREE (within free tier limits)
```

### For AWS App Runner:

```bash
# 1. Create Dockerfile (provided above)
# 2. Push code to GitHub
git push origin main

# 3. Go to AWS Console → App Runner
# 4. Create service from GitHub repository
# 5. Configure and deploy

# Total time: 20 minutes
# Cost: ~$10-30/month
```

---

## Support & Resources

- AWS Amplify Docs: https://docs.amplify.aws
- AWS App Runner Docs: https://docs.aws.amazon.com/apprunner
- Next.js Deployment: https://nextjs.org/docs/deployment
- Convex Deployment: https://docs.convex.dev/production

---

## Need Help?

If you encounter issues:
1. Check AWS CloudWatch logs
2. Verify environment variables
3. Test locally with Docker first
4. Review Convex connection settings