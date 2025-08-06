# create-fde-app

> Create production-ready applications with built-in cloud deployment configurations 🚀

[![npm version](https://img.shields.io/npm/v/create-fde-app.svg)](https://www.npmjs.com/package/create-fde-app)
[![npm downloads](https://img.shields.io/npm/dm/create-fde-app.svg)](https://www.npmjs.com/package/create-fde-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/create-fde-app.svg)](https://nodejs.org)

## Overview

`create-fde-app` is a powerful CLI tool designed for Forward Deploy Engineers (FDEs) to quickly scaffold modern web applications with production-ready cloud deployment configurations. It leverages official framework creation tools to ensure you always get the latest version of your chosen framework.

### Key Features

- 🎯 **Multiple Frameworks**: Next.js, Nuxt.js, Remix, and more
- ☁️ **Multi-Cloud Support**: AWS App Runner, Vercel, Google Cloud Run
- 🐳 **Docker Ready**: Optimized Dockerfiles for each framework
- 🔄 **CI/CD Built-in**: GitHub Actions workflows included
- 🏗️ **Infrastructure as Code**: Optional Terraform configurations
- 🔌 **Extensible**: Add databases, authentication, monitoring, and more
- 📦 **Always Latest**: Uses official create commands for frameworks

## Installation

### Prerequisites
- Node.js 18.0.0 or later
- yarn (recommended), npm, or pnpm
- Git (optional, for version control)
- Docker (optional, for containerization)

### Using npx (Recommended)
```bash
npx create-fde-app@latest
```

### Global Installation
```bash
yarn global add create-fde-app
create-fde-app my-app
```

### Verify Installation
```bash
create-fde-app --version
```

## Quick Start

```bash
npx create-fde-app@latest my-app
```

This will guide you through an interactive setup process to:
1. Choose your framework
2. Select deployment target
3. Configure optional features
4. Add advanced capabilities (databases, auth, monitoring)

## Supported Technologies

### Frameworks
- **Next.js** - React framework with server-side rendering
- **Nuxt.js** - Vue.js framework with server-side rendering  
- **Remix** - Full-stack web framework focused on web standards

### Deployment Targets
- **AWS App Runner** - Fully managed container service
- **Vercel** - Platform for frontend developers
- **Google Cloud Run** - Serverless container platform

### Optional Features
- **Docker** - Containerization with optimized multi-stage builds
- **GitHub Actions** - Automated CI/CD workflows
- **Terraform** - Infrastructure as Code (for AWS/GCP)

## Framework-Specific Features

### Next.js
- **App Router** - Modern React Server Components architecture
- **TypeScript** - Full TypeScript support out of the box
- **Tailwind CSS** - Utility-first CSS framework pre-configured
- **API Routes** - Built-in API endpoints with automatic health check
- **Optimizations** - Image optimization, font optimization, and more

### Nuxt.js
- **Nitro Server** - Universal deployment with edge rendering
- **Auto-imports** - Components, composables, and utilities auto-imported
- **Vue 3** - Latest Vue.js with Composition API
- **Server Routes** - File-based server API with health endpoint
- **Module System** - Extensible with rich ecosystem

### Remix
- **Web Standards** - Built on Web Fetch API and Web Streams
- **Nested Routing** - File-based routing with nested layouts
- **Progressive Enhancement** - Works without JavaScript
- **Form Actions** - Native form handling with server-side validation
- **Error Boundaries** - Granular error handling per route

### Advanced Features (Augmentations)

#### Databases
- PostgreSQL with Prisma ORM
- MySQL with Prisma ORM
- MongoDB with Mongoose ODM

#### Authentication
- NextAuth.js (Next.js only)
- Auth0 Integration
- AWS Cognito

#### Monitoring & Utilities
- Datadog APM & RUM
- Sentry Error Tracking
- Winston Logging
- Rate Limiting
- CORS Configuration

## Usage Examples

### Basic Next.js app with Vercel deployment
```bash
npx create-fde-app@latest my-nextjs-app
# Select: Next.js → Vercel → Docker
```

### Full-stack app with database and auth
```bash
npx create-fde-app@latest my-fullstack-app
# Select: Next.js → AWS App Runner → All features
# Then select: PostgreSQL, NextAuth.js, Monitoring
```

### Command-line options
```bash
# Skip interactive prompts
npx create-fde-app@latest my-app \
  --framework nextjs \
  --deploy aws-apprunner \
  --skip-git \
  --skip-install
```

### Non-interactive mode (CI/CD)
```bash
# Set environment variables for CI/CD
export CI=true
export CREATE_FDE_APP_FRAMEWORK=nextjs
export CREATE_FDE_APP_DEPLOY_TARGET=vercel
export CREATE_FDE_APP_FEATURES=docker,github-actions
export CREATE_FDE_APP_AUGMENTATIONS=database:postgres,auth:nextauth

npx create-fde-app@latest my-app --no-git --no-install
```

## Interactive CLI Experience

When you run `create-fde-app`, you'll be guided through an interactive setup:

```
create-fde-app v0.1.0
Welcome to create-fde-app!
Let's create a production-ready app with cloud deployment.

? What is your project name? my-awesome-app
? Which framework would you like to use? (Use arrow keys)
❯ Next.js - Full-stack React framework
  Nuxt.js - Full-stack Vue framework
  Remix - Full-stack web framework

? Where would you like to deploy? 
❯ AWS App Runner
  Vercel
  Google Cloud Run

? Select features to include: (Press <space> to select, <a> to toggle all)
❯◉ Docker containerization
 ◉ GitHub Actions CI/CD
 ◯ Terraform Infrastructure

? Select advanced features (optional): 
❯◯ PostgreSQL with Prisma
 ◯ MySQL with Prisma
 ◯ MongoDB with Mongoose
 ─────────────
 ◯ NextAuth.js (Next.js only)
 ◯ Auth0 Integration
 ◯ AWS Cognito
 ─────────────
 ◯ Datadog APM & RUM
 ◯ Sentry Error Tracking
 ◯ Winston Logging
 ◯ Rate Limiting
 ◯ CORS Configuration

? Initialize a git repository? Yes
? Install dependencies? Yes

✓ Creating project with official framework command...
✓ Processing project...
✓ Adding deployment configurations...
✓ Installing dependencies...
✓ Initializing git repository...

✨ Your project is ready!

Next steps:
  cd my-awesome-app
  yarn dev

To deploy:
  git push origin main

Happy coding! 🚀
```

## Project Structure

After creation, your project will have:

```
my-app/
├── [Framework files]        # Next.js/Nuxt.js/Remix application
├── Dockerfile              # Optimized for your framework
├── .dockerignore          
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD pipeline
├── terraform/             # If Terraform selected
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── [Augmentation files]   # Database, auth, monitoring configs
```

## Deployment Guide

Each project comes with deployment instructions tailored to your chosen platform:

### AWS App Runner
```bash
# Automated deployment via GitHub Actions
git push origin main

# Or manual Terraform deployment
cd terraform
terraform init
terraform plan
terraform apply
```

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `APPRUNNER_SERVICE_ARN` (after first deployment)

### Vercel
```bash
# Install Vercel CLI
yarn global add vercel

# Deploy
vercel
```

Required for automated deployments:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Google Cloud Run
```bash
# Automated deployment via GitHub Actions
git push origin main
```

Required GitHub Secrets:
- `GCP_SA_KEY` (Service Account JSON)
- `GCP_PROJECT_ID`

## Docker & Container Support

### Generated Dockerfile Features

Each framework gets an optimized Dockerfile with:
- **Multi-stage builds** - Smaller production images
- **Layer caching** - Faster rebuilds
- **Security hardening** - Non-root user, minimal base images
- **Health checks** - Container health monitoring

### Example: Next.js Dockerfile
```dockerfile
# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile --production

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Local Docker Commands
```bash
# Build the image
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app

# Run with environment variables
docker run -p 3000:3000 --env-file .env my-app

# View logs
docker logs <container-id>

# Execute commands in container
docker exec -it <container-id> sh
```

### Docker Compose Support
Create a `docker-compose.yml` for local development:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
  
  # Add database service if using database augmentation
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Advanced Configuration

### Adding Database Support
When you select a database augmentation, the tool will:
1. Install required dependencies (Prisma/Mongoose)
2. Create database schema files
3. Set up connection utilities
4. Add migration scripts
5. Configure environment variables

Example with PostgreSQL:
```bash
# After project creation
cd my-app
npx prisma migrate dev --name init
npm run dev
```

### Authentication Setup
Authentication augmentations provide:
- Pre-configured auth providers
- Protected route examples
- Session management
- User profile pages

### Monitoring Integration
Monitoring options include:
- APM (Application Performance Monitoring)
- Error tracking with session replay
- Custom metrics and alerts
- Performance dashboards

## Environment Variables

### Example `.env` file
```env
# Application
NODE_ENV=development
PORT=3000

# Database (if using database augmentation)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# Authentication (if using auth augmentation)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS (if using AWS services)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring (if using monitoring augmentation)
DATADOG_API_KEY=your-datadog-api-key
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Deployment
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

### Setting Environment Variables

#### Local Development
1. Copy `.env.example` to `.env`
2. Fill in your values
3. Never commit `.env` to version control

#### Production Deployment
- **Vercel**: Set via dashboard or CLI
- **AWS App Runner**: Set in service configuration
- **Google Cloud Run**: Set via gcloud CLI or console
- **GitHub Actions**: Add as repository secrets

## Development

### Prerequisites
- Node.js 18+
- Git
- Docker (optional)
- Terraform (optional)
- Cloud provider CLI tools (optional)

### Local Development
```bash
# Clone the repository
git clone https://github.com/fde/create-fde-app.git
cd create-fde-app

# Install dependencies
yarn install

# Run locally
node bin/create-fde-app.js my-test-app
```

### Testing
```bash
# Run unit tests
yarn test

# Run integration tests
yarn test:integration

# Run with coverage
yarn test:coverage
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

### Adding a New Framework
1. Add framework configuration to `config/frameworks.json`
2. Create post-processor in `post-processors/[framework]/`
3. Add Docker template in `deploy-templates/docker/[framework]/`
4. Update documentation

### Adding a New Deployment Target
1. Add configuration to `config/deploy-targets.json`
2. Create GitHub Actions template
3. Add Terraform modules if applicable
4. Update deployment documentation

## Troubleshooting

### Common Issues

#### "Directory already exists" error
```bash
Error: Directory my-app already exists
```
**Solution**: Remove the existing directory or choose a different name:
```bash
rm -rf my-app
# or
npx create-fde-app@latest my-new-app
```

#### Framework creation fails
```bash
Error: Failed to create nextjs project
```
**Solutions**:
- Check your internet connection
- Clear yarn cache: `yarn cache clean`
- Try with a different package manager: `yarn create fde-app`
- Verify Node.js version: `node --version` (must be 18+)

#### Permission errors
```bash
Error: EACCES: permission denied
```
**Solutions**:
- On macOS/Linux: Use `sudo npx create-fde-app@latest`
- Use a Node version manager (nvm, fnm, volta) to avoid permission issues
- Use a Node version manager (nvm, fnm, volta)

#### Deployment fails
```bash
Error: Deployment to AWS App Runner failed
```
**Solutions**:
- Verify AWS credentials: `aws sts get-caller-identity`
- Check all required GitHub Secrets are set
- Review GitHub Actions logs for specific errors
- Ensure Docker builds locally: `docker build .`

#### Database connection errors
```bash
Error: Can't reach database server
```
**Solutions**:
- Verify DATABASE_URL format
- Check if database server is running
- For local dev, ensure PostgreSQL/MySQL is installed
- For cloud databases, check firewall rules

#### Authentication provider errors
```bash
Error: Invalid OAuth callback URL
```
**Solutions**:
- Update callback URLs in provider settings
- Ensure NEXTAUTH_URL matches your domain
- Check CLIENT_ID and CLIENT_SECRET are correct
- Verify redirect URIs include `/api/auth/callback/[provider]`

#### Build failures
```bash
Error: Build optimization failed
```
**Solutions**:
- Check for TypeScript errors: `yarn type-check`
- Verify all dependencies are installed: `yarn install`
- Clear .next/dist folder: `rm -rf .next dist`
- Check for conflicting dependencies

### Framework-Specific Issues

#### Next.js
- **Module not found**: Check import paths and tsconfig.json paths
- **Hydration errors**: Ensure server and client render the same content
- **API route errors**: Verify route exports correct HTTP methods

#### Nuxt.js
- **Nitro build errors**: Clear `.nuxt` folder and rebuild
- **Auto-import issues**: Check components are in correct directories
- **Module conflicts**: Review `nuxt.config.ts` for duplicate modules

#### Remix
- **Loader errors**: Ensure loaders return Response or serializable data
- **Action errors**: Check form data parsing and validation
- **Route conflicts**: Verify no duplicate route files

## Security

- All dependencies are regularly updated
- Security scanning via GitHub Dependabot
- OWASP compliance checks for generated applications
- Secrets management best practices enforced

## License

MIT © FDE Team

## Acknowledgments

Built with ❤️ by Forward Deploy Engineers for Forward Deploy Engineers.

Special thanks to:
- The Next.js, Nuxt.js, and Remix teams for their amazing frameworks
- The open-source community for continuous inspiration

---

## Complete Example: Building a Full-Stack App

Here's a complete walkthrough of creating a production-ready application:

### Step 1: Create the Application
```bash
npx create-fde-app@latest taskmaster-pro
```

**Selections**:
- Framework: **Next.js**
- Deployment: **AWS App Runner**
- Features: **Docker**, **GitHub Actions**, **Terraform**
- Augmentations: **PostgreSQL**, **NextAuth.js**, **Sentry**

### Step 2: Configure Environment
```bash
cd taskmaster-pro
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskmaster"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
SENTRY_DSN="your-sentry-project-dsn"
```

### Step 3: Set Up Database
```bash
# Start PostgreSQL (using Docker)
docker run -d --name taskmaster-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=taskmaster \
  -p 5432:5432 \
  postgres:15-alpine

# Run migrations
yarn db:migrate
```

### Step 4: Local Development
```bash
# Start development server
yarn dev

# In another terminal, run Prisma Studio
yarn db:studio
```

Visit:
- App: http://localhost:3000
- Database: http://localhost:5555

### Step 5: Prepare for Deployment
```bash
# Build and test locally
yarn build
yarn start

# Test Docker build
docker build -t taskmaster-pro .
docker run -p 3000:3000 --env-file .env taskmaster-pro
```

### Step 6: Set Up GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create taskmaster-pro --public
git push -u origin main
```

### Step 7: Configure GitHub Secrets
Add these secrets in GitHub repository settings:
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
DATABASE_URL=your-production-db-url
NEXTAUTH_SECRET=your-production-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret
SENTRY_DSN=your-sentry-dsn
```

### Step 8: Deploy Infrastructure
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Save the output `apprunner_service_arn` and add it as `APPRUNNER_SERVICE_ARN` in GitHub Secrets.

### Step 9: Deploy Application
```bash
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build Docker image
3. Push to Amazon ECR
4. Deploy to App Runner

### Step 10: Monitor and Scale
- **Application Logs**: AWS CloudWatch
- **Error Tracking**: Sentry Dashboard
- **Database**: RDS Console
- **Scaling**: App Runner auto-scales based on traffic

### Production URLs
- App: `https://your-service.region.awsapprunner.com`
- Health: `https://your-service.region.awsapprunner.com/api/health`

### Next Steps
1. Set up custom domain
2. Configure production database backups
3. Set up monitoring alerts
4. Add more OAuth providers
5. Implement rate limiting

---

## Credits

Created and maintained by **BrainFiber Inc.**

**Need help?** 
- 📖 [Documentation](https://github.com/BrainFiber/create-fde-app/wiki)
- 🐛 [Report Issues](https://github.com/BrainFiber/create-fde-app/issues)
- 💬 [Discussions](https://github.com/BrainFiber/create-fde-app/discussions)

## License

MIT © BrainFiber Inc.