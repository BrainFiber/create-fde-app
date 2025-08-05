# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`create-fde-app` is a CLI tool for scaffolding production-ready web applications with built-in cloud deployment configurations. It wraps official framework creation tools (create-next-app, nuxi, create-remix) and extends them with deployment, monitoring, and advanced features.

## Common Development Commands

### Testing
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run with coverage report
yarn test:coverage

# Run integration tests only
yarn test:integration

# Run a single test file
NODE_OPTIONS='--experimental-vm-modules' jest path/to/test.js
```

### Code Quality
```bash
# Run ESLint
yarn lint

# Format code with Prettier
yarn format

# Check TypeScript types (no emit)
yarn type-check
```

### Local Development
```bash
# Test the CLI locally
node bin/create-fde-app.js my-test-app

# Test with specific options
node bin/create-fde-app.js my-app --framework nextjs --deploy vercel
```

## CLI Usage

### Basic Command
```bash
npx create-fde-app@latest [project-name]
```

### Command Line Options
- `-f, --framework <framework>` - Choose framework: `nextjs`, `nuxtjs`, `remix`
- `-d, --deploy <target>` - Choose deployment target: `aws-apprunner`, `vercel`, `gcp-cloudrun`
- `--skip-git` - Skip git repository initialization
- `--skip-install` - Skip dependency installation

### Non-Interactive Mode (CI/CD)
Set environment variables for automated project creation:
```bash
export CI=true
export CREATE_FDE_APP_PROJECT_DIR=my-app
export CREATE_FDE_APP_FRAMEWORK=nextjs
export CREATE_FDE_APP_DEPLOY_TARGET=vercel
export CREATE_FDE_APP_FEATURES=docker,github-actions
export CREATE_FDE_APP_AUGMENTATIONS=database:postgres,auth:nextauth

npx create-fde-app@latest
```

### Available Features
During interactive setup, you can select:
- **docker** - Docker containerization
- **github-actions** - GitHub Actions CI/CD workflow
- **terraform** - Infrastructure as Code (available for AWS and GCP targets)

### Available Augmentations

#### Authentication (`auth:*`)
- `auth:nextauth` - NextAuth.js (Next.js only)
- `auth:auth0` - Auth0 integration
- `auth:cognito` - AWS Cognito

#### Database (`database:*`)
- `database:postgres` - PostgreSQL with Prisma ORM
- `database:mysql` - MySQL with Prisma ORM
- `database:mongodb` - MongoDB with Mongoose ODM

#### Monitoring (`monitoring:*`)
- `monitoring:datadog` - Datadog APM & RUM

#### Utilities (`utility:*`)
- `utility:sentry` - Sentry error tracking
- `utility:logging` - Winston logging
- `utility:rate-limiting` - Rate limiting middleware
- `utility:cors` - CORS configuration

## Project Creation Flow

1. **CLI Entry** (`lib/cli.js`) - Parse command line arguments
2. **User Prompts** (`lib/prompts.js`) - Gather project configuration
3. **Framework Creation** (`lib/framework-wrapper.js`) - Run official create command
4. **Post Processing** (`lib/post-processor.js`) - Apply framework-specific modifications
5. **Deploy Injection** (`lib/deploy-injector.js`) - Add deployment configurations
6. **Augmentations** - Apply selected features (auth, database, monitoring, utilities)

### Generated Project Structure
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

## Architecture Overview

### Core Flow
1. **CLI Entry** (`lib/cli.js`) - Commander.js-based CLI interface
2. **User Prompts** (`lib/prompts.js`) - Interactive project configuration using Inquirer
3. **Framework Wrapper** (`lib/framework-wrapper.js`) - Executes official create commands (npx create-next-app, etc.)
4. **Post Processing** (`lib/post-processor.js`) - Applies framework-specific modifications
5. **Deploy Injection** (`lib/deploy-injector.js`) - Adds cloud deployment configurations
6. **Augmentations** (`lib/augmentations/`) - Optional features like auth, databases, monitoring

### Key Design Patterns

#### Framework Agnostic Wrapper
The tool doesn't bundle framework code but wraps official create commands, ensuring users always get the latest framework versions:
```javascript
// lib/framework-wrapper.js handles:
await execa('npx', ['create-next-app@latest', ...args])
```

#### Post-Processor Architecture
Each framework has specific post-processors in `post-processors/[framework]/` that modify the created project:
- Package.json modifications
- Configuration adjustments
- File structure changes

#### Template-Based Deployment
Deployment configurations use Handlebars templates in `deploy-templates/`:
- `docker/[framework]/` - Optimized Dockerfiles
- `github-actions/` - CI/CD workflows
- `terraform/` - Infrastructure as Code

#### Augmentation System
Modular augmentations in `lib/augmentations/` add features:
- **Database**: Prisma/Mongoose setup with connection utilities
- **Auth**: Provider configurations and protected routes
- **Monitoring**: APM and error tracking integrations
- **Utilities**: CORS, rate limiting, logging

### Configuration Files

- `config/frameworks.json` - Framework definitions and create commands
- `config/deploy-targets.json` - Cloud platform configurations
- `augmentations/[feature]/config.json` - Feature-specific settings

### Testing Strategy

- **Unit tests** (`test/unit/`) - Individual function testing
- **Integration tests** (`test/integration/`) - Full CLI flow testing
- **Fixtures** (`test/fixtures/`) - Mock data and test projects
- Jest with ES modules support (`NODE_OPTIONS='--experimental-vm-modules'`)

### Important Implementation Notes

1. **ES Modules**: Project uses `"type": "module"` - all imports must use `.js` extensions
2. **Node Version**: Requires Node.js >=18.0.0
3. **Error Handling**: Consistent error handling with `utils/logger.js`
4. **Git Integration**: Optional git initialization handled by `utils/git.js`
5. **CI Environment**: Supports non-interactive mode via environment variables

### Adding New Features

#### New Framework Support
1. Add to `config/frameworks.json` with create command details
2. Create post-processor in `post-processors/[framework]/`
3. Add Docker template in `deploy-templates/docker/[framework]/`
4. Update type definitions if using TypeScript features

#### New Deployment Target
1. Add to `config/deploy-targets.json`
2. Create deployment workflow in `deploy-templates/github-actions/`
3. Add Terraform modules in `deploy-templates/terraform/` if applicable
4. Update deployment documentation

#### New Augmentation
1. Create directory in `augmentations/[feature]/`
2. Add `config.json` with metadata
3. Create `setup.js` with installation logic
4. Add templates in `templates/` subdirectory

## Required GitHub Secrets

### AWS App Runner
- `AWS_ACCESS_KEY_ID` - AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `APPRUNNER_SERVICE_ARN` - App Runner service ARN (after first deployment)

### Vercel
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Google Cloud Run
- `GCP_SA_KEY` - Google Cloud service account JSON key
- `GCP_PROJECT_ID` - Google Cloud project ID