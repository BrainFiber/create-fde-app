import { join, dirname } from 'path';
import { readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import chalk from 'chalk';
import { logger } from './utils/logger.js';
import { executeTerraform } from './terraform-executor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function injectDeployConfig(projectDetails) {
  const { projectName, framework, deployTarget, features, deployConfig } = projectDetails;
  const projectPath = join(process.cwd(), projectName);

  logger.startSpinner('Adding deployment configurations...');

  try {
    // Add Docker configuration if requested
    if (features.includes('docker')) {
      await addDockerConfig(projectPath, framework);
    }

    // Add GitHub Actions workflow if requested
    if (features.includes('github-actions')) {
      await addGitHubActions(projectPath, projectDetails);
    }

    // Add Terraform configuration if requested
    if (features.includes('terraform') && deployConfig.terraform) {
      await executeTerraform(projectPath, deployTarget, projectDetails);
    }

    // Add deployment-specific files
    await addDeploymentSpecificFiles(projectPath, projectDetails);

    logger.stopSpinner(true, 'Deployment configurations added successfully!');
  } catch (error) {
    logger.stopSpinner(false, 'Failed to add deployment configurations');
    throw error;
  }
}

async function addDockerConfig(projectPath, framework) {
  // Read framework-specific Dockerfile template
  let dockerfileContent;
  const dockerTemplatePath = join(__dirname, '..', 'deploy-templates', 'docker', framework, 'Dockerfile');
  
  try {
    dockerfileContent = await readFile(dockerTemplatePath, 'utf-8');
    logger.info(`Using ${framework}-specific Dockerfile template`);
  } catch (error) {
    // Fall back to generic Node.js Dockerfile
    logger.warn(`No ${framework}-specific Dockerfile found, using generic template`);
    const genericTemplatePath = join(__dirname, '..', 'deploy-templates', 'docker', 'common', 'Dockerfile.base');
    try {
      dockerfileContent = await readFile(genericTemplatePath, 'utf-8');
    } catch {
      // Use inline fallback
      dockerfileContent = `# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["yarn", "start"]
`;
    }
  }

  const dockerignoreContent = `# Dependencies
node_modules
yarn-error.log
yarn-debug.log
pnpm-debug.log

# Build outputs
.next
.nuxt
.output
dist
build

# Environment files
.env
.env.*
!.env.example

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Documentation
README.md
docs
*.md

# Testing
coverage
.nyc_output
test
tests
__tests__
*.test.js
*.spec.js

# Terraform
terraform
*.tfstate
*.tfstate.*
.terraform

# CI/CD
.github
.gitlab-ci.yml
.circleci

# Development files
.eslintrc*
.prettierrc*
tsconfig.json
jsconfig.json
`;

  await writeFile(join(projectPath, 'Dockerfile'), dockerfileContent);
  await writeFile(join(projectPath, '.dockerignore'), dockerignoreContent);
}

async function addGitHubActions(projectPath, projectDetails) {
  const { deployTarget, projectName, deployConfig } = projectDetails;
  
  // Create .github/workflows directory
  const workflowDir = join(projectPath, '.github', 'workflows');
  await mkdir(workflowDir, { recursive: true });
  
  // Map deploy targets to workflow template files
  const workflowTemplates = {
    'aws-apprunner': 'aws-apprunner.yml',
    'vercel': 'vercel.yml',
    'gcp-cloudrun': 'gcp-cloudrun.yml'
  };
  
  const templateFile = workflowTemplates[deployTarget];
  if (!templateFile) {
    logger.warn(`No GitHub Actions template found for ${deployTarget}`);
    return;
  }
  
  // Read template file
  const templatePath = join(__dirname, '..', 'deploy-templates', 'github-actions', templateFile);
  let templateContent = await readFile(templatePath, 'utf-8');
  
  // Replace Handlebars variables in the template
  // Only replace our custom variables, keep GitHub Actions expressions intact
  templateContent = templateContent
    .replace(/\{\{ projectName \}\}/g, projectName)
    .replace(/\{\{ awsRegion \}\}/g, deployConfig.awsRegion || 'us-east-1')
    .replace(/\{\{ gcpProjectId \}\}/g, deployConfig.gcpProjectId || '')
    .replace(/\{\{ gcpRegion \}\}/g, deployConfig.gcpRegion || 'us-central1');
  
  // Write workflow file
  await writeFile(join(workflowDir, 'deploy.yml'), templateContent);
  logger.info(`Created GitHub Actions workflow for ${deployTarget}`);
}

async function addTerraformConfig(projectPath, projectDetails) {
  const { deployTarget, projectName, deployConfig } = projectDetails;
  
  // Map deploy targets to terraform template directories
  const terraformTemplates = {
    'aws-apprunner': 'aws-apprunner',
    'gcp-cloudrun': 'gcp-cloudrun'
    // Vercel doesn't use Terraform
  };
  
  const templateDir = terraformTemplates[deployTarget];
  if (!templateDir) {
    logger.info(`No Terraform template needed for ${deployTarget}`);
    return;
  }
  
  // Create terraform directory
  const terraformDir = join(projectPath, 'terraform');
  await mkdir(terraformDir, { recursive: true });
  
  // Copy all terraform files from template directory
  const sourcePath = join(__dirname, '..', 'deploy-templates', 'terraform', templateDir);
  const files = ['main.tf', 'variables.tf', 'outputs.tf', 'terraform.tfvars.example'];
  
  for (const file of files) {
    const sourceFile = join(sourcePath, file);
    const destFile = join(terraformDir, file);
    
    if (file === 'terraform.tfvars.example') {
      // Process tfvars file with project-specific values
      const content = await readFile(sourceFile, 'utf-8');
      const template = Handlebars.compile(content);
      const rendered = template({
        projectName,
        projectId: deployConfig.gcpProjectId || 'your-project-id',
        awsRegion: deployConfig.awsRegion || 'us-east-1',
        gcpRegion: deployConfig.gcpRegion || 'us-central1'
      });
      await writeFile(destFile, rendered);
    } else {
      // Copy other files as-is
      await copyFile(sourceFile, destFile);
    }
  }
  
  logger.info(`Created Terraform configuration for ${deployTarget}`);
}

async function addDeploymentSpecificFiles(projectPath, projectDetails) {
  const { deployTarget, projectName } = projectDetails;
  
  // Add deployment-specific configuration files
  if (deployTarget === 'vercel') {
    await addVercelConfig(projectPath, projectDetails);
  }
  
  // Add README with deployment instructions
  const deployTargetDisplay = {
    'aws-apprunner': 'AWS App Runner',
    'vercel': 'Vercel',
    'gcp-cloudrun': 'Google Cloud Run'
  }[deployTarget] || deployTarget;

  const readmeContent = `# ${projectName}

Created with create-fde-app 🚀

## Getting Started

\`\`\`bash
yarn install
yarn dev
\`\`\`

## Deployment

This project is configured for deployment to ${deployTargetDisplay}.

### Prerequisites

${getDeploymentPrerequisites(deployTarget)}

### Deploy

${getDeploymentInstructions(deployTarget)}

## Environment Variables

See \`.env.example\` for required environment variables.

## Learn More

- [create-fde-app documentation](https://github.com/fde/create-fde-app)
`;

  await writeFile(join(projectPath, 'README.md'), readmeContent);
}

async function addVercelConfig(projectPath, projectDetails) {
  const { framework } = projectDetails;
  
  // Create vercel.json configuration
  const vercelConfig = {
    buildCommand: framework === 'nextjs' ? null : 'yarn build',
    outputDirectory: framework === 'nextjs' ? null : getOutputDirectory(framework),
    framework: framework === 'nextjs' ? 'nextjs' : null,
    regions: ['iad1'], // Default to US East
    env: {
      NODE_ENV: 'production'
    }
  };
  
  // Remove null values
  Object.keys(vercelConfig).forEach(key => {
    if (vercelConfig[key] === null) {
      delete vercelConfig[key];
    }
  });
  
  await writeFile(
    join(projectPath, 'vercel.json'),
    JSON.stringify(vercelConfig, null, 2)
  );
  
  logger.info('Created Vercel configuration');
}

function getOutputDirectory(framework) {
  const outputDirs = {
    'nextjs': '.next',
    'nuxtjs': '.output/public',
    'remix': 'build/client',
    'sveltekit': '.svelte-kit',
    'astro': 'dist',
    'vite': 'dist'
  };
  
  return outputDirs[framework] || 'dist';
}

function getDeploymentInstructions(deployTarget) {
  const instructions = {
    'aws-apprunner': `1. Push your code to GitHub
2. The GitHub Actions workflow will automatically deploy your application
3. (Optional) Use Terraform to set up infrastructure:
   \`\`\`bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   \`\`\``,
    'vercel': `1. Install Vercel CLI: \`yarn global add vercel\`
2. Run \`vercel\` to link your project
3. Push to GitHub - deployments will be automatic
4. For manual deployment: \`vercel --prod\``,
    'gcp-cloudrun': `1. Push your code to GitHub
2. The GitHub Actions workflow will automatically deploy your application
3. (Optional) Use Terraform to set up infrastructure:
   \`\`\`bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   \`\`\``
  };
  
  return instructions[deployTarget] || '1. Push your code to GitHub\n2. Follow the deployment guide';
}

function getDeploymentPrerequisites(deployTarget) {
  const prerequisites = {
    'aws-apprunner': `- AWS Account
- AWS CLI configured
- Terraform installed (optional, for infrastructure setup)
- GitHub Secrets configured:
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - APPRUNNER_SERVICE_ARN`,
    'vercel': `- Vercel Account
- Vercel CLI installed
- GitHub Secrets configured:
  - VERCEL_TOKEN
  - VERCEL_ORG_ID
  - VERCEL_PROJECT_ID`,
    'gcp-cloudrun': `- Google Cloud Account
- gcloud CLI configured
- GitHub Secrets configured:
  - GCP_SA_KEY
  - GCP_PROJECT_ID`
  };

  return prerequisites[deployTarget] || 'Check documentation for deployment requirements.';
}