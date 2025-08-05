import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configurations
const frameworksConfig = JSON.parse(
  readFileSync(join(__dirname, '..', 'config', 'frameworks.json'), 'utf8')
);
const deployTargetsConfig = JSON.parse(
  readFileSync(join(__dirname, '..', 'config', 'deploy-targets.json'), 'utf8')
);

export async function promptProjectDetails(projectName, options) {
  const questions = [];

  // Project name
  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: 'my-fde-app',
      validate: (input) => {
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, and hyphens';
        }
        if (existsSync(join(process.cwd(), input))) {
          return `Directory ${input} already exists`;
        }
        return true;
      },
    });
  }

  // Framework selection
  if (!options.framework) {
    questions.push({
      type: 'list',
      name: 'framework',
      message: 'Which framework would you like to use?',
      choices: Object.entries(frameworksConfig).map(([key, config]) => ({
        name: `${config.displayName} - ${config.description || 'Modern web framework'}`,
        value: key,
      })),
    });
  }

  // Deployment target
  if (!options.deploy) {
    questions.push({
      type: 'list',
      name: 'deployTarget',
      message: 'Where would you like to deploy?',
      choices: Object.entries(deployTargetsConfig).map(([key, config]) => ({
        name: `${config.displayName} - ${config.description || 'Cloud platform'}`,
        value: key,
      })),
    });
  }

  // Additional features
  questions.push({
    type: 'checkbox',
    name: 'features',
    message: 'Select additional features:',
    choices: [
      { name: 'TypeScript', value: 'typescript', checked: true },
      { name: 'ESLint', value: 'eslint', checked: true },
      { name: 'Prettier', value: 'prettier', checked: true },
      { name: 'Health Check Endpoint', value: 'health-check', checked: true },
      { name: 'Environment Variables', value: 'env-vars', checked: true },
      { name: 'Docker Support', value: 'docker', checked: true },
      { name: 'GitHub Actions CI/CD', value: 'github-actions', checked: true },
      { name: 'Terraform Infrastructure', value: 'terraform', checked: false },
    ],
  });

  // Augmentations (advanced features)
  questions.push({
    type: 'checkbox',
    name: 'augmentations',
    message: 'Select advanced features (optional):',
    choices: [
      new inquirer.Separator('--- Database ---'),
      { name: 'PostgreSQL with Prisma', value: 'database:postgres' },
      { name: 'MySQL with Prisma', value: 'database:mysql' },
      { name: 'MongoDB with Prisma', value: 'database:mongodb' },
      new inquirer.Separator('--- Authentication ---'),
      { name: 'NextAuth.js (Next.js only)', value: 'auth:nextauth' },
      { name: 'Auth0', value: 'auth:auth0' },
      { name: 'AWS Cognito', value: 'auth:cognito' },
      new inquirer.Separator('--- Monitoring ---'),
      { name: 'Datadog APM & RUM', value: 'monitoring:datadog' },
      new inquirer.Separator('--- Utilities ---'),
      { name: 'Sentry Error Tracking', value: 'utility:sentry' },
      { name: 'Winston Logging', value: 'utility:logging' },
      { name: 'API Rate Limiting', value: 'utility:rate-limiting' },
      { name: 'CORS Configuration', value: 'utility:cors' },
    ],
  });

  // Git initialization
  if (options.skipGit === undefined) {
    questions.push({
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize a git repository?',
      default: true,
    });
  }

  const answers = await inquirer.prompt(questions);

  // Get deployment-specific configuration
  const deployTarget = options.deploy || answers.deployTarget;
  const deploymentConfig = await promptDeploymentConfig(deployTarget);

  return {
    projectName: projectName || answers.projectName,
    framework: options.framework || answers.framework,
    deployTarget,
    features: answers.features || [],
    augmentations: answers.augmentations || [],
    initGit: options.skipGit ? false : answers.initGit,
    skipInstall: options.skipInstall || false,
    frameworkConfig: frameworksConfig[options.framework || answers.framework],
    deployConfig: {
      ...deployTargetsConfig[deployTarget],
      ...deploymentConfig
    },
  };
}

async function promptDeploymentConfig(deployTarget) {
  const questions = [];

  switch (deployTarget) {
    case 'aws-apprunner':
      questions.push({
        type: 'input',
        name: 'awsRegion',
        message: 'AWS Region:',
        default: 'us-east-1',
      });
      break;

    case 'gcp-cloudrun':
      questions.push({
        type: 'input',
        name: 'gcpProjectId',
        message: 'GCP Project ID:',
        validate: (input) => {
          if (!input.trim()) {
            return 'GCP Project ID is required for Cloud Run deployment';
          }
          return true;
        },
      });
      questions.push({
        type: 'input',
        name: 'gcpRegion',
        message: 'GCP Region:',
        default: 'us-central1',
      });
      break;

    case 'vercel':
      // Vercel configuration is handled via CLI
      return {};
  }

  if (questions.length > 0) {
    console.log(chalk.yellow('\nDeployment Configuration:'));
    return await inquirer.prompt(questions);
  }

  return {};
}