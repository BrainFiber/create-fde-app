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

// Export for testing
export async function promptQuestions() {
  // Check if running in CI mode
  if (process.env.CI === 'true') {
    return {
      framework: process.env.CREATE_FDE_APP_FRAMEWORK || 'nextjs',
      deployTarget: process.env.CREATE_FDE_APP_DEPLOY_TARGET || 'vercel',
      features: process.env.CREATE_FDE_APP_FEATURES 
        ? process.env.CREATE_FDE_APP_FEATURES.split(',').filter(Boolean)
        : [],
      augmentations: process.env.CREATE_FDE_APP_AUGMENTATIONS
        ? process.env.CREATE_FDE_APP_AUGMENTATIONS.split(',').filter(Boolean)
        : [],
      initGit: false, // Always false in CI
      installDeps: false // Always false in CI
    };
  }

  // Normal interactive mode
  const questions = [
    {
      type: 'list',
      name: 'framework',
      message: 'Which framework would you like to use?',
      choices: ['Next.js', 'Nuxt.js', 'Remix']
    },
    {
      type: 'list',
      name: 'deployTarget',
      message: 'Where would you like to deploy?',
      choices: ['AWS App Runner', 'Vercel', 'Google Cloud Run']
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select additional features:',
      choices: answers => {
        const choices = [
          { name: 'Docker containerization', value: 'docker' },
          { name: 'GitHub Actions CI/CD', value: 'github-actions' }
        ];
        
        // Add Terraform only for supported targets
        const deployConfig = deployTargetsConfig[answers.deployTarget] || {};
        if (deployConfig.terraform) {
          choices.push({ name: 'Terraform Infrastructure', value: 'terraform' });
        }
        
        return choices;
      },
      when: answers => answers.deployTarget !== undefined
    },
    {
      type: 'checkbox',
      name: 'augmentations',
      message: 'Select advanced features (optional):',
      choices: [
        new inquirer.Separator('--- Database ---'),
        { name: 'PostgreSQL with Prisma', value: 'database:postgres' },
        { name: 'MySQL with Prisma', value: 'database:mysql' },
        { name: 'MongoDB with Mongoose', value: 'database:mongodb' },
        new inquirer.Separator('--- Authentication ---'),
        { name: 'NextAuth.js (Next.js only)', value: 'auth:nextauth' },
        { name: 'Auth0 Integration', value: 'auth:auth0' },
        { name: 'AWS Cognito', value: 'auth:cognito' },
        new inquirer.Separator('--- Monitoring ---'),
        { name: 'Datadog APM & RUM', value: 'monitoring:datadog' },
        new inquirer.Separator('--- Utilities ---'),
        { name: 'Sentry Error Tracking', value: 'utility:sentry' },
        { name: 'Winston Logging', value: 'utility:logging' },
        { name: 'Rate Limiting', value: 'utility:rate-limiting' },
        { name: 'CORS Configuration', value: 'utility:cors' }
      ],
      when: answers => answers.deployTarget !== 'vercel' // Vercel has its own monitoring
    },
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize git repository?',
      default: true
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install dependencies?',
      default: true
    }
  ];

  return await inquirer.prompt(questions);
}

export async function promptProjectDetails(projectName, options) {
  // Check if running in CI mode
  if (process.env.CI === 'true') {
    return {
      projectName: process.env.CREATE_FDE_APP_PROJECT_DIR || projectName || 'my-fde-app',
      framework: process.env.CREATE_FDE_APP_FRAMEWORK || options.framework || 'nextjs',
      deployTarget: process.env.CREATE_FDE_APP_DEPLOY_TARGET || options.deploy || 'vercel',
      features: process.env.CREATE_FDE_APP_FEATURES 
        ? process.env.CREATE_FDE_APP_FEATURES.split(',').filter(Boolean)
        : ['docker', 'github-actions'],
      augmentations: process.env.CREATE_FDE_APP_AUGMENTATIONS
        ? process.env.CREATE_FDE_APP_AUGMENTATIONS.split(',').filter(Boolean)
        : [],
      initGit: false,
      skipInstall: true,
      frameworkConfig: frameworksConfig[process.env.CREATE_FDE_APP_FRAMEWORK || options.framework || 'nextjs'],
      deployConfig: deployTargetsConfig[process.env.CREATE_FDE_APP_DEPLOY_TARGET || options.deploy || 'vercel']
    };
  }

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

  // Deploy target selection
  if (!options.deploy) {
    questions.push({
      type: 'list',
      name: 'deployTarget',
      message: 'Where would you like to deploy?',
      choices: Object.entries(deployTargetsConfig).map(([key, config]) => ({
        name: config.displayName,
        value: key,
      })),
    });
  }

  // Features selection
  questions.push({
    type: 'checkbox',
    name: 'features',
    message: 'Select features to include:',
    choices: (answers) => {
      const choices = [
        { name: 'Docker containerization', value: 'docker' },
        { name: 'GitHub Actions CI/CD', value: 'github-actions' },
      ];

      // Add Terraform only for supported targets
      const deployTarget = options.deploy || answers.deployTarget;
      const deployConfig = deployTargetsConfig[deployTarget] || {};
      if (deployConfig.terraform) {
        choices.push({ name: 'Terraform Infrastructure', value: 'terraform' });
      }

      return choices;
    },
    when: () => questions.some(q => q.name === 'deployTarget') || options.deploy,
  });

  // Advanced features (augmentations)
  questions.push({
    type: 'checkbox',
    name: 'augmentations',
    message: 'Select advanced features (optional):',
    choices: [
      new inquirer.Separator('--- Database ---'),
      { name: 'PostgreSQL with Prisma', value: 'database:postgres' },
      { name: 'MySQL with Prisma', value: 'database:mysql' },
      { name: 'MongoDB with Mongoose', value: 'database:mongodb' },
      new inquirer.Separator('--- Authentication ---'),
      { name: 'NextAuth.js (Next.js only)', value: 'auth:nextauth', when: (answers) => (options.framework || answers.framework) === 'nextjs' },
      { name: 'Auth0 Integration', value: 'auth:auth0' },
      { name: 'AWS Cognito', value: 'auth:cognito' },
      new inquirer.Separator('--- Monitoring ---'),
      { name: 'Datadog APM & RUM', value: 'monitoring:datadog' },
      new inquirer.Separator('--- Utilities ---'),
      { name: 'Sentry Error Tracking', value: 'utility:sentry' },
      { name: 'Winston Logging', value: 'utility:logging' },
      { name: 'Rate Limiting', value: 'utility:rate-limiting' },
      { name: 'CORS Configuration', value: 'utility:cors' },
    ],
    when: (answers) => {
      const deployTarget = options.deploy || answers.deployTarget;
      return deployTarget !== 'vercel'; // Vercel has its own monitoring
    }
  });

  // Git initialization
  if (!options.skipGit) {
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