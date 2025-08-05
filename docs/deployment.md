# Deployment Guide

This guide covers deploying applications created with `create-fde-app` to various cloud platforms.

## Table of Contents

- [Overview](#overview)
- [AWS App Runner](#aws-app-runner)
- [Vercel](#vercel)
- [Google Cloud Run](#google-cloud-run)
- [Docker Deployment](#docker-deployment)
- [Terraform Infrastructure](#terraform-infrastructure)
- [Environment Variables](#environment-variables)
- [Monitoring Deployments](#monitoring-deployments)
- [Troubleshooting](#troubleshooting)

## Overview

Applications created with `create-fde-app` come with deployment configurations tailored to your chosen platform. All deployments can be automated through GitHub Actions or performed manually.

### Deployment Methods

1. **Automated (Recommended)**: Push to GitHub → GitHub Actions → Deploy
2. **Manual**: Use platform CLI tools or web console
3. **Infrastructure as Code**: Use Terraform for reproducible deployments

## AWS App Runner

AWS App Runner is a fully managed service that makes it easy to deploy containerized applications.

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **ECR (Elastic Container Registry)** repository (created automatically with Terraform)

### Automated Deployment

1. **Set up GitHub Secrets**:
   ```
   AWS_ACCESS_KEY_ID: your-access-key
   AWS_SECRET_ACCESS_KEY: your-secret-key
   AWS_REGION: us-east-1
   ```

2. **First Deployment**:
   ```bash
   # Commit and push your code
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Get Service ARN** from GitHub Actions logs and add as secret:
   ```
   APPRUNNER_SERVICE_ARN: arn:aws:apprunner:...
   ```

### Manual Deployment with Terraform

1. **Navigate to Terraform directory**:
   ```bash
   cd terraform
   ```

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Review plan**:
   ```bash
   terraform plan
   ```

4. **Apply configuration**:
   ```bash
   terraform apply
   ```

5. **Get outputs**:
   ```bash
   terraform output
   # Shows app_url and service_arn
   ```

### App Runner Configuration

The generated `apprunner.yaml` includes:
- Auto-scaling configuration (1-10 instances)
- Health check endpoint
- Environment variables
- CPU/Memory allocation

### Customization

Edit `terraform/variables.tf` to customize:
```hcl
variable "cpu" {
  default = "0.25 vCPU"  # Options: 0.25, 0.5, 1, 2
}

variable "memory" {
  default = "0.5 GB"     # Options: 0.5, 1, 2, 3, 4
}
```

## Vercel

Vercel provides zero-configuration deployment for frontend frameworks.

### Prerequisites

1. **Vercel Account** (free tier available)
2. **Vercel CLI** (optional)

### Automated Deployment

1. **Connect GitHub Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects framework settings

2. **Set up GitHub Integration**:
   - Automatic deployments on push
   - Preview deployments for PRs
   - Custom domains configuration

### Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow prompts**:
   - Link to existing project or create new
   - Confirm settings
   - Deploy to production

### Production Deployment

```bash
vercel --prod
```

### Configuration

`vercel.json` is automatically generated with:
- Build settings
- Output directory
- Environment variables
- Regions configuration

### Custom Domains

1. **Add domain in Vercel dashboard**
2. **Update DNS records**
3. **SSL certificates auto-provisioned**

### Environment Variables

Set in Vercel dashboard or CLI:
```bash
vercel env add DATABASE_URL
vercel env add API_KEY
```

## Google Cloud Run

Google Cloud Run is a fully managed serverless platform for containerized applications.

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Project ID** configured

### Automated Deployment

1. **Enable required APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Create Service Account**:
   ```bash
   gcloud iam service-accounts create github-actions
   ```

3. **Grant permissions**:
   ```bash
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"
   ```

4. **Create key and add to GitHub Secrets**:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com
   ```
   Add contents of `key.json` as `GCP_SA_KEY` secret

5. **Add GitHub Secrets**:
   ```
   GCP_SA_KEY: <contents of key.json>
   GCP_PROJECT_ID: your-project-id
   ```

### Manual Deployment

1. **Build container**:
   ```bash
   docker build -t gcr.io/PROJECT_ID/app-name .
   ```

2. **Push to Container Registry**:
   ```bash
   docker push gcr.io/PROJECT_ID/app-name
   ```

3. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy app-name \
     --image gcr.io/PROJECT_ID/app-name \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Terraform Deployment

```bash
cd terraform
terraform init
terraform apply -var="project_id=your-project-id"
```

### Configuration Options

- **Concurrency**: Max requests per instance
- **Memory**: 128Mi to 8Gi
- **CPU**: 1 to 4 vCPUs
- **Min/Max Instances**: Auto-scaling settings

## Docker Deployment

All applications include optimized Docker configurations.

### Building Images

```bash
# Development build
docker build -t my-app:dev .

# Production build with multi-stage
docker build -t my-app:latest --target production .
```

### Running Containers

```bash
# Basic run
docker run -p 3000:3000 my-app

# With environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgres://... \
  my-app

# With volume for development
docker run -p 3000:3000 \
  -v $(pwd):/app \
  my-app:dev
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Terraform Infrastructure

For platforms that support it, Terraform provides infrastructure as code.

### Structure

```
terraform/
├── main.tf          # Main configuration
├── variables.tf     # Input variables
├── outputs.tf       # Output values
└── terraform.tfvars # Variable values (gitignored)
```

### Common Commands

```bash
# Initialize
terraform init

# Format files
terraform fmt

# Validate configuration
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy resources
terraform destroy
```

### State Management

For production:
1. Use remote state backend (S3, GCS, etc.)
2. Enable state locking
3. Encrypt state files

Example S3 backend:
```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "app-name/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}
```

## Environment Variables

### Development

Create `.env.local`:
```bash
DATABASE_URL=postgres://localhost/myapp
REDIS_URL=redis://localhost:6379
API_KEY=development-key
```

### Production

Set in your deployment platform:

**Vercel Dashboard**:
- Settings → Environment Variables
- Add for Production/Preview/Development

**AWS App Runner**:
- In `apprunner.yaml` or Terraform
- Use AWS Secrets Manager for sensitive data

**Google Cloud Run**:
- Cloud Console → Service → Edit & Deploy New Revision
- Or use Secret Manager

### Best Practices

1. **Never commit secrets**
2. **Use different values per environment**
3. **Rotate credentials regularly**
4. **Use secret management services**
5. **Document required variables**

## Monitoring Deployments

### GitHub Actions

- Check Actions tab for deployment status
- View logs for debugging
- Set up notifications

### Platform Dashboards

**AWS App Runner**:
- CloudWatch metrics
- Application logs
- Request tracing

**Vercel**:
- Real-time logs
- Performance analytics
- Error tracking

**Google Cloud Run**:
- Cloud Console metrics
- Cloud Logging
- Cloud Trace

### Health Checks

All deployments include health check endpoints:
- Next.js: `/api/health`
- Nuxt.js: `/api/health`
- Remix: `/health`

## Troubleshooting

### Common Issues

#### Build Failures

**Problem**: Docker build fails
```
Solution:
1. Check Dockerfile syntax
2. Verify all files are included
3. Check .dockerignore
4. Review build logs
```

**Problem**: GitHub Actions fails
```
Solution:
1. Check secrets are set correctly
2. Verify permissions
3. Review action logs
4. Test locally first
```

#### Runtime Errors

**Problem**: Application crashes on start
```
Solution:
1. Check environment variables
2. Verify port configuration
3. Review application logs
4. Test container locally
```

**Problem**: Database connection fails
```
Solution:
1. Verify connection string
2. Check network configuration
3. Ensure database is accessible
4. Review security groups/firewall
```

#### Performance Issues

**Problem**: Slow response times
```
Solution:
1. Check instance size
2. Review application metrics
3. Optimize Docker image
4. Enable caching
```

### Debug Commands

```bash
# Check container logs
docker logs container-id

# SSH into container
docker exec -it container-id sh

# Test health endpoint
curl http://localhost:3000/api/health

# Check environment
docker exec container-id env
```

### Getting Help

1. Check platform documentation
2. Review GitHub Actions logs
3. Use platform support
4. Ask in community forums

## Best Practices

1. **Use CI/CD**: Automate deployments
2. **Monitor actively**: Set up alerts
3. **Scale appropriately**: Start small, scale as needed
4. **Secure everything**: Use HTTPS, secure headers
5. **Document process**: Keep deployment docs updated

## Next Steps

- Set up custom domains
- Configure CDN
- Implement monitoring
- Add backup strategies
- Plan for disaster recovery