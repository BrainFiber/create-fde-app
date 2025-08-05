import { execa } from 'execa';
import { join } from 'path';
import chalk from 'chalk';
import { logger } from './utils/logger.js';

export async function wrapFrameworkCommand(projectDetails) {
  const { projectName, framework, frameworkConfig, features } = projectDetails;
  
  logger.startSpinner(`Creating ${frameworkConfig.displayName} project...`);

  try {
    // Build command arguments
    const args = [];
    
    if (framework === 'nextjs') {
      args.push('create-next-app@latest');
      args.push(projectName);
      
      // Add default args if TypeScript is selected
      if (features.includes('typescript')) {
        args.push('--typescript');
      }
      
      // Add other default args from config
      if (frameworkConfig.defaultArgs) {
        args.push(...frameworkConfig.defaultArgs.filter(arg => 
          !args.includes(arg) && 
          !(arg === '--typescript' && !features.includes('typescript'))
        ));
      }
      
      // Skip installation if requested
      if (projectDetails.skipInstall) {
        args.push('--skip-install');
      }
    } else if (framework === 'nuxtjs') {
      args.push('nuxi@latest');
      args.push('init');
      args.push(projectName);
      
      // Add package manager to avoid interactive prompt
      args.push('--packageManager', 'yarn');
      
      if (projectDetails.skipInstall) {
        args.push('--no-install');
      }
    } else if (framework === 'remix') {
      args.push('create-remix@latest');
      args.push(projectName);
      
      // Add --yes to accept defaults and avoid prompts
      args.push('--yes');
      
      if (features.includes('typescript')) {
        args.push('--typescript');
      }
      
      if (projectDetails.skipInstall) {
        args.push('--no-install');
      }
    }

    // Execute the framework's create command
    logger.info(chalk.gray(`Running: npx ${args.join(' ')}`));
    
    const subprocess = execa('npx', args, {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    subprocess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(chalk.gray(output));
      }
    });

    subprocess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('warning')) {
        console.error(chalk.yellow(output));
      }
    });

    await subprocess;

    logger.stopSpinner(true, `${frameworkConfig.displayName} project created successfully!`);
  } catch (error) {
    logger.stopSpinner(false, 'Failed to create project');
    throw new Error(`Failed to create ${framework} project: ${error.message}`);
  }
}