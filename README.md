# create-fde-app

> Create production-ready applications with built-in cloud deployment configurations 🚀

[![npm version](https://img.shields.io/npm/v/create-fde-app.svg)](https://www.npmjs.com/package/create-fde-app)
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
npm i -g vercel

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
npm install

# Run locally
node bin/create-fde-app.js my-test-app
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
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

**"Directory already exists" error**
- The target directory must not exist. Remove it or choose a different name.

**Framework creation fails**
- Ensure you have a stable internet connection
- Check that npx/npm is properly installed
- Verify Node.js version is 18+

**Deployment fails**
- Verify cloud credentials are properly configured
- Check GitHub Secrets are set correctly
- Review deployment logs in GitHub Actions

**Augmentation errors**
- Some augmentations are framework-specific (e.g., NextAuth.js for Next.js only)
- Check compatibility in the selection menu
- Ensure all required environment variables are set

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

**Need help?** 
- 📖 [Documentation](https://github.com/fde/create-fde-app/wiki)
- 🐛 [Report Issues](https://github.com/fde/create-fde-app/issues)
- 💬 [Discussions](https://github.com/fde/create-fde-app/discussions)