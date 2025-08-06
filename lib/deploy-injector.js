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
      await addDockerConfig(projectPath, framework, projectDetails);
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

async function addDockerConfig(projectPath, framework, projectDetails) {
  const { monorepo, monorepoPath, projectName } = projectDetails;
  
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
  
  // Adjust Dockerfile for monorepo context
  if (monorepo) {
    const appPath = `${monorepoPath}${projectName}`;
    
    // Update COPY commands to use app-specific paths when copying from host
    // This regex matches COPY commands that don't have --from flag (copying from host)
    dockerfileContent = dockerfileContent
      .replace(/^COPY\s+(?!--from)(.+?)\s+(.+)$/gm, (match, source, dest) => {
        // Handle special cases like "COPY . ."
        if (source === '.') {
          return `COPY ${appPath}/ ${dest}`;
        }
        // Handle package files
        if (source.includes('package') || source.includes('yarn.lock') || source.includes('pnpm-lock')) {
          return `COPY ${appPath}/${source} ${dest}`;
        }
        // Handle other files
        return `COPY ${appPath}/${source} ${dest}`;
      });
    
    // Add a comment at the top indicating monorepo build context
    dockerfileContent = `# Monorepo Dockerfile - Build context should be repository root\n# App path: ${appPath}\n\n${dockerfileContent}`;
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
  const { deployTarget, projectName, deployConfig, monorepo, monorepoPath } = projectDetails;
  
  // Create .github/workflows directory
  const workflowDir = join(projectPath, '.github', 'workflows');
  await mkdir(workflowDir, { recursive: true });
  
  // Map deploy targets to workflow template files
  const workflowTemplates = {
    'aws-apprunner': 'aws-apprunner.yml',
    'vercel': 'vercel-ci.yml',  // Use CI-only workflow for Vercel
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
  
  // Handle monorepo-specific transformations
  if (monorepo) {
    const appPath = `${monorepoPath}${projectName}`;
    
    // Replace app path placeholders
    templateContent = templateContent
      .replace(/\{\{ appPath \}\}/g, appPath);
    
    // Update workflow name to include project name
    templateContent = templateContent
      .replace(/^name: Deploy to (.+)$/m, `name: Deploy ${projectName} to $1`);
    
    // Add path filters to triggers
    templateContent = templateContent
      .replace(/(on:\s*push:\s*branches:\s*\[main\])/g, 
        `$1\n    paths:\n      - '${appPath}/**'\n      - '.github/workflows/${projectName}-deploy.yml'`)
      .replace(/(pull_request:\s*branches:\s*\[main\])/g,
        `$1\n    paths:\n      - '${appPath}/**'\n      - '.github/workflows/${projectName}-deploy.yml'`);
    
    // Add working directory to all run commands
    templateContent = templateContent
      .replace(/(\s+)(run: \|?\s*\n)/g, (match, indent, runLine) => {
        return `${indent}working-directory: ${appPath}\n${indent}${runLine}`;
      });
    
    // Update Docker build context for monorepo
    templateContent = templateContent
      .replace(/(docker build -t .+?) \./g, `$1 ${appPath}`);
    
    // Update vercel commands to not need cd
    templateContent = templateContent
      .replace(/cd \{\{ appPath \}\}\n\s*/g, '');
  } else {
    // Remove any remaining monorepo placeholders for non-monorepo mode
    templateContent = templateContent
      .replace(/\{\{ appPath \}\}/g, '.');
  }
  
  // Generate workflow filename
  // In monorepo mode, use project-specific name; otherwise use deploy.yml
  const workflowFileName = monorepo ? `${projectName}-deploy.yml` : 'deploy.yml';
  
  // Write workflow file
  await writeFile(join(workflowDir, workflowFileName), templateContent);
  logger.info(`Created GitHub Actions workflow ${workflowFileName} for ${deployTarget}`);
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
  const { framework, monorepo, monorepoPath, projectName } = projectDetails;
  
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
  
  // Add monorepo-specific configuration
  if (monorepo) {
    const appPath = `${monorepoPath}${projectName}`;
    vercelConfig.rootDirectory = appPath;
    
    // Add build settings for monorepo
    vercelConfig.builds = [{
      src: `${appPath}/package.json`,
      use: '@vercel/node'
    }];
    
    // Update build command to work from monorepo root
    if (vercelConfig.buildCommand) {
      vercelConfig.buildCommand = `cd ${appPath} && ${vercelConfig.buildCommand}`;
    }
  }
  
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
    'vercel': `### First-time Setup

1. **Install Vercel CLI** (if not already installed):
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. **Link your project to Vercel**:
   \`\`\`bash
   npm run vercel:init
   # Or manually:
   npx vercel link
   \`\`\`

3. **Connect your GitHub repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Vercel will automatically deploy on every push

### Deployment

**Automatic**: Push to GitHub main branch
**Manual**: Run \`npm run deploy:prod\` or \`vercel --prod\`

### CI/CD

The GitHub Actions workflow will:
- Run tests and build checks on every push
- Vercel handles the actual deployment automatically`,
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
    'vercel': `- Vercel Account (free tier available)
- GitHub repository
- No manual secrets configuration needed! Vercel handles everything automatically when you connect your GitHub repo`,
    'gcp-cloudrun': `- Google Cloud Account
- gcloud CLI configured
- GitHub Secrets configured:
  - GCP_SA_KEY
  - GCP_PROJECT_ID`
  };

  return prerequisites[deployTarget] || 'Check documentation for deployment requirements.';
}