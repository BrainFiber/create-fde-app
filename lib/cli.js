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
    .action(async (projectName, options) => {
      try {
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