import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Handlebars from 'handlebars';
import { logger } from './utils/logger.js';

export class TerraformExecutor {
  constructor(projectPath, deployTarget, projectDetails) {
    this.projectPath = projectPath;
    this.deployTarget = deployTarget;
    this.projectDetails = projectDetails;
    this.terraformDir = join(projectPath, 'terraform');
  }

  /**
   * Check if Terraform is installed
   */
  async checkTerraformInstalled() {
    try {
      const version = execSync('terraform version', { encoding: 'utf8' });
      logger.info(`Terraform version: ${version.split('\n')[0]}`);
      return true;
    } catch (error) {
      logger.error('Terraform is not installed');
      return false;
    }
  }

  /**
   * Initialize Terraform configuration
   */
  async initialize() {
    const spinner = ora('Checking Terraform installation...').start();

    // Check if Terraform is installed
    const isInstalled = await this.checkTerraformInstalled();
    if (!isInstalled) {
      spinner.fail('Terraform is not installed');
      console.log(chalk.yellow('\nPlease install Terraform first:'));
      console.log(chalk.cyan('  brew install terraform') + ' (macOS)');
      console.log(chalk.cyan('  https://www.terraform.io/downloads') + ' (other platforms)\n');
      return false;
    }
    spinner.succeed('Terraform is installed');

    // Create terraform directory
    if (!existsSync(this.terraformDir)) {
      mkdirSync(this.terraformDir, { recursive: true });
    }

    // Copy terraform templates based on deploy target
    await this.copyTerraformTemplates();

    // Generate tfvars file
    await this.generateTfvars();

    return true;
  }

  /**
   * Copy Terraform templates for the deploy target
   */
  async copyTerraformTemplates() {
    const spinner = ora('Copying Terraform templates...').start();

    const templateDir = join(
      this.projectPath,
      '..',
      'deploy-templates',
      'terraform',
      this.deployTarget
    );

    if (!existsSync(templateDir)) {
      spinner.fail(`Terraform templates not found for ${this.deployTarget}`);
      return false;
    }

    // Copy all .tf files
    const files = ['main.tf', 'variables.tf', 'outputs.tf'];
    for (const file of files) {
      const sourcePath = join(templateDir, file);
      if (existsSync(sourcePath)) {
        const content = readFileSync(sourcePath, 'utf8');
        writeFileSync(join(this.terraformDir, file), content);
      }
    }

    // Copy terraform.tfvars.example as reference
    const tfvarsExamplePath = join(templateDir, 'terraform.tfvars.example');
    if (existsSync(tfvarsExamplePath)) {
      const content = readFileSync(tfvarsExamplePath, 'utf8');
      writeFileSync(join(this.terraformDir, 'terraform.tfvars.example'), content);
    }

    spinner.succeed('Terraform templates copied');
    return true;
  }

  /**
   * Generate terraform.tfvars file with project-specific values
   */
  async generateTfvars() {
    const tfvarsPath = join(this.terraformDir, 'terraform.tfvars');
    
    // If tfvars already exists, ask if user wants to regenerate
    if (existsSync(tfvarsPath)) {
      const { regenerate } = await inquirer.prompt([{
        type: 'confirm',
        name: 'regenerate',
        message: 'terraform.tfvars already exists. Regenerate?',
        default: false
      }]);

      if (!regenerate) {
        return;
      }
    }

    // Read the example file as template
    const examplePath = join(this.terraformDir, 'terraform.tfvars.example');
    if (!existsSync(examplePath)) {
      logger.warn('terraform.tfvars.example not found, creating basic tfvars');
      this.createBasicTfvars();
      return;
    }

    const template = readFileSync(examplePath, 'utf8');
    const compiledTemplate = Handlebars.compile(template);

    // Prepare template variables
    const templateVars = {
      projectName: this.projectDetails.projectName,
      awsRegion: this.projectDetails.deployConfig.awsRegion || 'us-east-1',
      gcpProjectId: this.projectDetails.deployConfig.gcpProjectId || '',
      gcpRegion: this.projectDetails.deployConfig.gcpRegion || 'us-central1',
      environment: 'production'
    };

    const tfvarsContent = compiledTemplate(templateVars);
    writeFileSync(tfvarsPath, tfvarsContent);

    console.log(chalk.green('\n✓ Generated terraform.tfvars'));
    console.log(chalk.yellow('  Please review and update the values before running terraform apply\n'));
  }

  /**
   * Create basic tfvars file if template is missing
   */
  createBasicTfvars() {
    const basicTfvars = `# Project Configuration
project_name = "${this.projectDetails.projectName}"
environment  = "production"

# Add your configuration values here
`;
    writeFileSync(join(this.terraformDir, 'terraform.tfvars'), basicTfvars);
  }

  /**
   * Run terraform init
   */
  async runInit() {
    const spinner = ora('Running terraform init...').start();

    try {
      execSync('terraform init', {
        cwd: this.terraformDir,
        stdio: 'inherit'
      });
      spinner.succeed('Terraform initialized');
      return true;
    } catch (error) {
      spinner.fail('Terraform init failed');
      logger.error(error.message);
      return false;
    }
  }

  /**
   * Run terraform plan
   */
  async runPlan() {
    const spinner = ora('Running terraform plan...').start();

    try {
      execSync('terraform plan -out=tfplan', {
        cwd: this.terraformDir,
        stdio: 'inherit'
      });
      spinner.succeed('Terraform plan completed');
      return true;
    } catch (error) {
      spinner.fail('Terraform plan failed');
      logger.error(error.message);
      return false;
    }
  }

  /**
   * Run terraform apply
   */
  async runApply() {
    console.log(chalk.yellow('\n⚠️  This will create real infrastructure and may incur costs!\n'));

    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Do you want to apply the Terraform configuration?',
      default: false
    }]);

    if (!proceed) {
      console.log(chalk.yellow('Terraform apply cancelled'));
      return false;
    }

    const spinner = ora('Running terraform apply...').start();

    try {
      execSync('terraform apply tfplan', {
        cwd: this.terraformDir,
        stdio: 'inherit'
      });
      spinner.succeed('Terraform apply completed');
      
      // Show outputs
      console.log(chalk.green('\n✓ Infrastructure created successfully!'));
      this.showOutputs();
      
      return true;
    } catch (error) {
      spinner.fail('Terraform apply failed');
      logger.error(error.message);
      return false;
    }
  }

  /**
   * Show Terraform outputs
   */
  showOutputs() {
    try {
      const outputs = execSync('terraform output -json', {
        cwd: this.terraformDir,
        encoding: 'utf8'
      });

      const outputData = JSON.parse(outputs);
      if (Object.keys(outputData).length > 0) {
        console.log(chalk.cyan('\nTerraform Outputs:'));
        for (const [key, value] of Object.entries(outputData)) {
          console.log(`  ${key}: ${chalk.green(value.value)}`);
        }
      }
    } catch (error) {
      // Outputs might not be available
    }
  }

  /**
   * Run the complete Terraform workflow
   */
  async execute() {
    console.log(chalk.blue('\n🏗️  Setting up infrastructure with Terraform\n'));

    // Initialize Terraform configuration
    const initialized = await this.initialize();
    if (!initialized) {
      return false;
    }

    // Ask user if they want to run Terraform now
    const { runNow } = await inquirer.prompt([{
      type: 'confirm',
      name: 'runNow',
      message: 'Do you want to run Terraform now?',
      default: false
    }]);

    if (!runNow) {
      console.log(chalk.yellow('\nTerraform files have been generated in the terraform/ directory'));
      console.log(chalk.cyan('To deploy your infrastructure later, run:'));
      console.log(chalk.gray('  cd terraform'));
      console.log(chalk.gray('  terraform init'));
      console.log(chalk.gray('  terraform plan'));
      console.log(chalk.gray('  terraform apply\n'));
      return true;
    }

    // Run Terraform workflow
    const initSuccess = await this.runInit();
    if (!initSuccess) return false;

    const planSuccess = await this.runPlan();
    if (!planSuccess) return false;

    const applySuccess = await this.runApply();
    if (!applySuccess) return false;

    console.log(chalk.green('\n✅ Infrastructure setup complete!\n'));
    return true;
  }

  /**
   * Generate README for Terraform usage
   */
  generateTerraformReadme() {
    const readme = `# Terraform Infrastructure

This directory contains Terraform configuration for deploying your application to ${this.deployTarget}.

## Prerequisites

1. Install Terraform: https://www.terraform.io/downloads
2. Configure cloud credentials:
   ${this.getCredentialsInstructions()}

## Usage

1. Review and update \`terraform.tfvars\` with your configuration
2. Initialize Terraform:
   \`\`\`bash
   terraform init
   \`\`\`
3. Plan the infrastructure:
   \`\`\`bash
   terraform plan
   \`\`\`
4. Apply the configuration:
   \`\`\`bash
   terraform apply
   \`\`\`

## Destroy Infrastructure

To tear down the infrastructure:
\`\`\`bash
terraform destroy
\`\`\`

## Files

- \`main.tf\`: Main infrastructure configuration
- \`variables.tf\`: Variable definitions
- \`outputs.tf\`: Output values
- \`terraform.tfvars\`: Your configuration values (not committed to git)
- \`terraform.tfvars.example\`: Example configuration file
`;

    writeFileSync(join(this.terraformDir, 'README.md'), readme);
  }

  /**
   * Get cloud-specific credentials instructions
   */
  getCredentialsInstructions() {
    switch (this.deployTarget) {
      case 'aws-apprunner':
      case 'aws-ecs':
        return `
   - AWS: Configure AWS CLI with \`aws configure\` or set environment variables:
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY
     - AWS_DEFAULT_REGION`;
      
      case 'gcp-cloudrun':
        return `
   - GCP: Authenticate with \`gcloud auth application-default login\` or set:
     - GOOGLE_APPLICATION_CREDENTIALS (path to service account key file)`;
      
      default:
        return '   - Configure appropriate cloud provider credentials';
    }
  }
}

/**
 * Execute Terraform for a project
 */
export async function executeTerraform(projectPath, deployTarget, projectDetails) {
  const executor = new TerraformExecutor(projectPath, deployTarget, projectDetails);
  
  // Generate README
  executor.generateTerraformReadme();
  
  // Execute Terraform workflow
  return await executor.execute();
}