import { Command } from 'commander';
import chalk from 'chalk';
import { promptProjectDetails } from './prompts.js';
import { wrapFrameworkCommand } from './framework-wrapper.js';
import { processProject } from './post-processor.js';
import { injectDeployConfig } from './deploy-injector.js';
import { logger } from './utils/logger.js';

export async function runCLI() {
  const program = new Command();

  program
    .name('create-fde-app')
    .description('Create production-ready apps with built-in cloud deployment')
    .version('0.1.0')
    .argument('[project-name]', 'Name of the project')
    .option('-f, --framework <framework>', 'Framework to use (nextjs, nuxtjs, remix)')
    .option('-d, --deploy <target>', 'Deployment target (aws-apprunner, vercel, gcp-cloudrun)')
    .option('--skip-git', 'Skip git initialization')
    .option('--skip-install', 'Skip installing dependencies')
    .option('--monorepo', 'Enable monorepo mode for generated project')
    .option('--monorepo-path <path>', 'Path within monorepo where app will be created (default: apps/)')
    .option('--help-ai', 'Output AI-friendly help in JSON format')
    .addHelpText('after', `
AI AGENT USAGE (NON-INTERACTIVE MODE):
=====================================
CRITICAL: Always use CI=true to bypass ALL interactive prompts

COMPLETE COMMAND SYNTAX:
  CI=true CREATE_FDE_APP_PROJECT_DIR=<name> CREATE_FDE_APP_FRAMEWORK=<fw> CREATE_FDE_APP_DEPLOY_TARGET=<target> npx create-fde-app@latest

ENVIRONMENT VARIABLES (Required for AI usage):
  CI=true                                   # MANDATORY: Enables non-interactive mode
  CREATE_FDE_APP_PROJECT_DIR=<string>       # Project directory name (e.g., "my-app")

ENVIRONMENT VARIABLES (Optional):
  CREATE_FDE_APP_FRAMEWORK=<string>         # Framework choice
    Values: nextjs | nuxtjs | remix
    Default: nextjs
    
  CREATE_FDE_APP_DEPLOY_TARGET=<string>     # Deployment platform
    Values: vercel | aws-apprunner | gcp-cloudrun
    Default: vercel
    
  CREATE_FDE_APP_FEATURES=<string>          # Comma-separated features
    Values: docker,github-actions,terraform
    Example: "docker,github-actions"
    Default: "docker,github-actions"
    Note: terraform only available for aws-apprunner and gcp-cloudrun
    
  CREATE_FDE_APP_AUGMENTATIONS=<string>     # Comma-separated augmentations
    Database: database:postgres | database:mysql | database:mongodb
    Auth: auth:nextauth | auth:auth0 | auth:cognito
    Monitoring: monitoring:datadog
    Utilities: utility:sentry | utility:logging | utility:rate-limiting | utility:cors
    Example: "database:postgres,auth:nextauth,utility:sentry"
    Default: none
    Note: auth:nextauth only works with nextjs framework
    Note: monitoring:* not available for vercel deployment
    
  CREATE_FDE_APP_MONOREPO=<boolean>         # Enable monorepo structure
    Values: true | false
    Default: false
    
  CREATE_FDE_APP_MONOREPO_PATH=<string>     # Monorepo app path
    Default: "apps/"

COMPLETE EXAMPLES FOR COPY-PASTE:

1. MINIMAL NEXT.JS WITH VERCEL:
   CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=nextjs CREATE_FDE_APP_DEPLOY_TARGET=vercel npx create-fde-app@latest

2. NEXT.JS WITH AWS APP RUNNER + POSTGRES + AUTH:
   CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=nextjs CREATE_FDE_APP_DEPLOY_TARGET=aws-apprunner CREATE_FDE_APP_FEATURES=docker,github-actions,terraform CREATE_FDE_APP_AUGMENTATIONS=database:postgres,auth:nextauth npx create-fde-app@latest

3. NUXT.JS WITH GCP CLOUD RUN + FULL STACK:
   CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=nuxtjs CREATE_FDE_APP_DEPLOY_TARGET=gcp-cloudrun CREATE_FDE_APP_FEATURES=docker,github-actions,terraform CREATE_FDE_APP_AUGMENTATIONS=database:mongodb,auth:auth0,monitoring:datadog,utility:sentry npx create-fde-app@latest

4. REMIX WITH VERCEL + UTILITIES:
   CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=remix CREATE_FDE_APP_DEPLOY_TARGET=vercel CREATE_FDE_APP_FEATURES=docker,github-actions CREATE_FDE_APP_AUGMENTATIONS=utility:logging,utility:rate-limiting,utility:cors npx create-fde-app@latest

5. MONOREPO SETUP:
   CI=true CREATE_FDE_APP_PROJECT_DIR=web-app CREATE_FDE_APP_FRAMEWORK=nextjs CREATE_FDE_APP_DEPLOY_TARGET=vercel CREATE_FDE_APP_MONOREPO=true CREATE_FDE_APP_MONOREPO_PATH=apps/web npx create-fde-app@latest

FRAMEWORK DETAILS:
  nextjs:
    - Creates: Next.js 14+ with App Router, TypeScript, Tailwind CSS
    - Build: yarn build
    - Start: yarn start
    - Dev: yarn dev
    - Port: 3000
    - Health endpoint: /api/health
    - Post-processors: nextjs-health, nextjs-docker
    
  nuxtjs:
    - Creates: Nuxt 3 with Vue 3, TypeScript support
    - Build: yarn build
    - Start: yarn start
    - Dev: yarn dev
    - Port: 3000
    - Health endpoint: /api/health
    - Post-processors: nuxtjs-health, nuxtjs-docker
    
  remix:
    - Creates: Remix with React, TypeScript
    - Build: yarn build
    - Start: yarn start
    - Dev: yarn dev
    - Port: 3000
    - Health endpoint: /health
    - Post-processors: remix-health, remix-docker

DEPLOYMENT TARGET DETAILS:
  vercel:
    - Platform: Frontend cloud platform
    - Requirements: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID (GitHub secrets)
    - Features: Edge functions, preview deployments, automatic HTTPS
    - Terraform: No
    - Best for: Frontend apps, JAMstack, serverless APIs
    - GitHub Actions: vercel.yml
    
  aws-apprunner:
    - Platform: Fully managed container service
    - Requirements: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (GitHub secrets)
    - Optional: APPRUNNER_SERVICE_ARN (after first deployment)
    - Features: Auto-scaling, managed containers, custom domains
    - Terraform: Yes (infrastructure as code included)
    - Best for: Containerized apps, microservices
    - GitHub Actions: aws-apprunner.yml
    - Env vars: AWS_REGION (default: us-east-1)
    
  gcp-cloudrun:
    - Platform: Serverless container platform
    - Requirements: GCP_SA_KEY, GCP_PROJECT_ID (GitHub secrets)
    - Features: Serverless containers, auto-scaling, VPC connector
    - Terraform: Yes (infrastructure as code included)
    - Best for: Event-driven apps, microservices
    - GitHub Actions: gcp-cloudrun.yml
    - Env vars: GCP_REGION (default: us-central1)

AUGMENTATION COMPATIBILITY MATRIX:
  auth:nextauth    -> nextjs only
  auth:auth0       -> all frameworks
  auth:cognito     -> all frameworks
  database:*       -> all frameworks
  monitoring:*     -> aws-apprunner, gcp-cloudrun (not vercel)
  utility:*        -> all frameworks

GENERATED PROJECT STRUCTURE:
  my-app/
  ├── [Framework files]           # Next.js/Nuxt.js/Remix application
  ├── Dockerfile                  # If docker feature selected
  ├── .dockerignore              
  ├── .github/
  │   └── workflows/
  │       └── deploy.yml         # If github-actions feature selected
  ├── terraform/                 # If terraform feature selected
  │   ├── main.tf
  │   ├── variables.tf
  │   ├── outputs.tf
  │   └── terraform.tfvars.example
  ├── prisma/                    # If database augmentation selected
  │   └── schema.prisma
  ├── lib/                       # Augmentation utilities
  │   ├── auth/                  # If auth augmentation selected
  │   ├── db/                    # If database augmentation selected
  │   └── monitoring/            # If monitoring augmentation selected
  └── [Other augmentation files]

POST-CREATION ACTIONS:
  The tool will:
  1. Create project using official framework CLI (npx create-next-app@latest, etc.)
  2. Apply framework-specific optimizations
  3. Inject deployment configurations
  4. Add selected augmentations
  5. Skip git init (CI mode always skips)
  6. Skip dependency installation (CI mode always skips)

VALIDATION RULES:
  - Project name: lowercase letters, numbers, hyphens only (^[a-z0-9-]+$)
  - Directory must not exist
  - Framework must be exactly: nextjs, nuxtjs, or remix (lowercase)
  - Deploy target must be exactly: vercel, aws-apprunner, or gcp-cloudrun (lowercase)
  - Features are optional, can be empty string or omitted
  - Augmentations are optional, can be empty string or omitted

ERROR PREVENTION:
  - ALWAYS set CI=true to avoid interactive prompts
  - ALWAYS provide CREATE_FDE_APP_PROJECT_DIR
  - Use exact lowercase string values for framework and deploy target
  - Separate multiple features/augmentations with commas (no spaces)
  - Check directory doesn't exist before running: test ! -d my-app

DEBUGGING CHECKLIST:
  If command fails, verify:
  1. CI environment variable is exactly "true" (CI=true)
  2. CREATE_FDE_APP_PROJECT_DIR is provided and valid
  3. Directory doesn't already exist (rm -rf my-app if needed)
  4. Framework value is exactly one of: nextjs, nuxtjs, remix (lowercase)
  5. Deploy target is exactly one of: vercel, aws-apprunner, gcp-cloudrun (lowercase)
  6. Features/augmentations use correct format (comma-separated, no spaces)

COMMON AI AGENT MISTAKES TO AVOID:
  ❌ DON'T: npx create-fde-app my-app --framework nextjs
  ✅ DO: CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=nextjs npx create-fde-app@latest
  
  ❌ DON'T: Forget CI=true (will trigger interactive mode)
  ✅ DO: Always start with CI=true
  
  ❌ DON'T: Use spaces in comma-separated values
  ✅ DO: CREATE_FDE_APP_FEATURES=docker,github-actions (no spaces)
  
  ❌ DON'T: Mix command-line args with env vars
  ✅ DO: Use ONLY environment variables when CI=true

For structured JSON output, use: npx create-fde-app@latest --help-ai
`)
    .action(async (projectName, options) => {
      try {
        // Handle --help-ai flag for JSON output
        if (options.helpAi) {
          const aiHelp = {
            command: "npx create-fde-app@latest",
            description: "Create production-ready apps with built-in cloud deployment configurations",
            usage: "CI=true CREATE_FDE_APP_PROJECT_DIR=<name> [ENV_VARS...] npx create-fde-app@latest",
            criticalNote: "ALWAYS set CI=true to enable non-interactive mode for AI agents",
            requiredEnvVars: {
              CI: {
                value: "true",
                description: "MANDATORY: Enable non-interactive mode",
                type: "boolean",
                example: "CI=true"
              },
              CREATE_FDE_APP_PROJECT_DIR: {
                type: "string",
                description: "Project directory name",
                validation: "^[a-z0-9-]+$",
                example: "my-app"
              }
            },
            optionalEnvVars: {
              CREATE_FDE_APP_FRAMEWORK: {
                type: "enum",
                values: ["nextjs", "nuxtjs", "remix"],
                default: "nextjs",
                description: "Web framework to use"
              },
              CREATE_FDE_APP_DEPLOY_TARGET: {
                type: "enum",
                values: ["vercel", "aws-apprunner", "gcp-cloudrun"],
                default: "vercel",
                description: "Cloud deployment platform"
              },
              CREATE_FDE_APP_FEATURES: {
                type: "array",
                values: ["docker", "github-actions", "terraform"],
                separator: ",",
                default: ["docker", "github-actions"],
                description: "Additional features to include",
                notes: "terraform only available for aws-apprunner and gcp-cloudrun"
              },
              CREATE_FDE_APP_AUGMENTATIONS: {
                type: "array",
                values: {
                  database: ["database:postgres", "database:mysql", "database:mongodb"],
                  auth: ["auth:nextauth", "auth:auth0", "auth:cognito"],
                  monitoring: ["monitoring:datadog"],
                  utilities: ["utility:sentry", "utility:logging", "utility:rate-limiting", "utility:cors"]
                },
                separator: ",",
                description: "Advanced features and integrations",
                notes: [
                  "auth:nextauth only works with nextjs",
                  "monitoring:* not available for vercel"
                ]
              },
              CREATE_FDE_APP_MONOREPO: {
                type: "boolean",
                values: ["true", "false"],
                default: "false",
                description: "Enable monorepo structure"
              },
              CREATE_FDE_APP_MONOREPO_PATH: {
                type: "string",
                default: "apps/",
                description: "Path within monorepo for app"
              }
            },
            examples: [
              {
                description: "Minimal Next.js with Vercel",
                command: "CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=nextjs CREATE_FDE_APP_DEPLOY_TARGET=vercel npx create-fde-app@latest"
              },
              {
                description: "Next.js with AWS App Runner, PostgreSQL, and NextAuth",
                command: "CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=nextjs CREATE_FDE_APP_DEPLOY_TARGET=aws-apprunner CREATE_FDE_APP_FEATURES=docker,github-actions,terraform CREATE_FDE_APP_AUGMENTATIONS=database:postgres,auth:nextauth npx create-fde-app@latest"
              },
              {
                description: "Nuxt.js with GCP Cloud Run and full stack features",
                command: "CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=nuxtjs CREATE_FDE_APP_DEPLOY_TARGET=gcp-cloudrun CREATE_FDE_APP_FEATURES=docker,github-actions,terraform CREATE_FDE_APP_AUGMENTATIONS=database:mongodb,auth:auth0,monitoring:datadog,utility:sentry npx create-fde-app@latest"
              },
              {
                description: "Remix with Vercel and utility features",
                command: "CI=true CREATE_FDE_APP_PROJECT_DIR=my-app CREATE_FDE_APP_FRAMEWORK=remix CREATE_FDE_APP_DEPLOY_TARGET=vercel CREATE_FDE_APP_FEATURES=docker,github-actions CREATE_FDE_APP_AUGMENTATIONS=utility:logging,utility:rate-limiting,utility:cors npx create-fde-app@latest"
              },
              {
                description: "Monorepo setup with Next.js",
                command: "CI=true CREATE_FDE_APP_PROJECT_DIR=web-app CREATE_FDE_APP_FRAMEWORK=nextjs CREATE_FDE_APP_DEPLOY_TARGET=vercel CREATE_FDE_APP_MONOREPO=true CREATE_FDE_APP_MONOREPO_PATH=apps/web npx create-fde-app@latest"
              }
            ],
            frameworkDetails: {
              nextjs: {
                displayName: "Next.js",
                description: "Full-stack React framework",
                creates: "Next.js 14+ with App Router, TypeScript, Tailwind CSS",
                commands: { build: "yarn build", start: "yarn start", dev: "yarn dev" },
                port: 3000,
                healthEndpoint: "/api/health",
                postProcessors: ["nextjs-health", "nextjs-docker"]
              },
              nuxtjs: {
                displayName: "Nuxt.js",
                description: "Full-stack Vue framework",
                creates: "Nuxt 3 with Vue 3, TypeScript support",
                commands: { build: "yarn build", start: "yarn start", dev: "yarn dev" },
                port: 3000,
                healthEndpoint: "/api/health",
                postProcessors: ["nuxtjs-health", "nuxtjs-docker"]
              },
              remix: {
                displayName: "Remix",
                description: "Full-stack web framework",
                creates: "Remix with React, TypeScript",
                commands: { build: "yarn build", start: "yarn start", dev: "yarn dev" },
                port: 3000,
                healthEndpoint: "/health",
                postProcessors: ["remix-health", "remix-docker"]
              }
            },
            deployTargetDetails: {
              vercel: {
                displayName: "Vercel",
                description: "Frontend cloud platform",
                githubSecrets: ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"],
                features: ["edge functions", "preview deployments", "automatic HTTPS"],
                terraform: false,
                githubActionsFile: "vercel.yml"
              },
              "aws-apprunner": {
                displayName: "AWS App Runner",
                description: "Fully managed container service",
                githubSecrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
                optionalSecrets: ["APPRUNNER_SERVICE_ARN"],
                features: ["auto-scaling", "managed containers", "custom domains"],
                terraform: true,
                githubActionsFile: "aws-apprunner.yml",
                defaultEnvVars: { AWS_REGION: "us-east-1" }
              },
              "gcp-cloudrun": {
                displayName: "Google Cloud Run",
                description: "Serverless container platform",
                githubSecrets: ["GCP_SA_KEY", "GCP_PROJECT_ID"],
                features: ["serverless containers", "auto-scaling", "VPC connector"],
                terraform: true,
                githubActionsFile: "gcp-cloudrun.yml",
                defaultEnvVars: { GCP_REGION: "us-central1" }
              }
            },
            validationRules: [
              "Project name must match ^[a-z0-9-]+$",
              "Directory must not exist",
              "Framework must be exactly: nextjs, nuxtjs, or remix",
              "Deploy target must be exactly: vercel, aws-apprunner, or gcp-cloudrun",
              "All values must be lowercase",
              "Comma-separated values must not contain spaces"
            ],
            commonErrors: [
              { error: "Interactive prompts appear", solution: "Set CI=true" },
              { error: "Directory already exists", solution: "Remove directory or use different name" },
              { error: "Invalid framework", solution: "Use exactly: nextjs, nuxtjs, or remix (lowercase)" },
              { error: "Invalid deploy target", solution: "Use exactly: vercel, aws-apprunner, or gcp-cloudrun (lowercase)" },
              { error: "Features not working", solution: "Use comma-separated list without spaces" }
            ],
            postCreationBehavior: {
              gitInit: "Skipped in CI mode",
              dependencyInstall: "Skipped in CI mode",
              actionsPerformed: [
                "Creates project using official framework CLI",
                "Applies framework-specific optimizations",
                "Injects deployment configurations",
                "Adds selected augmentations",
                "Generates Dockerfile if docker feature selected",
                "Creates GitHub Actions workflow if github-actions feature selected",
                "Generates Terraform files if terraform feature selected and supported"
              ]
            }
          };
          
          console.log(JSON.stringify(aiHelp, null, 2));
          process.exit(0);
        }

        logger.info(chalk.bold('Welcome to create-fde-app!'));
        logger.info('Let\'s create a production-ready app with cloud deployment.\n');

        // Get project details through prompts
        const projectDetails = await promptProjectDetails(projectName, options);

        // Create project using framework's official create command
        logger.info(chalk.blue('Creating project with official framework command...'));
        await wrapFrameworkCommand(projectDetails);

        // Process project with post-processors
        logger.info(chalk.blue('Processing project...'));
        await processProject(projectDetails);

        // Inject deployment configurations
        logger.info(chalk.blue('Adding deployment configurations...'));
        await injectDeployConfig(projectDetails);

        // Success message
        logger.success(chalk.green.bold('\n✨ Your project is ready!'));
        logger.info(`\nNext steps:`);
        logger.info(chalk.cyan(`  cd ${projectDetails.projectName}`));
        logger.info(chalk.cyan('  yarn dev'));
        logger.info('\nTo deploy:');
        logger.info(chalk.cyan('  git push origin main'));
        logger.info('\nHappy coding! 🚀');
      } catch (error) {
        logger.error('Failed to create project:', error.message);
        process.exit(1);
      }
    });

  program.parse();
}