import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { logger } from '../../lib/utils/logger.js';

/**
 * Base post-processor functionality shared across all frameworks
 */
export class BasePostProcessor {
  constructor(projectPath, framework, projectDetails) {
    this.projectPath = projectPath;
    this.framework = framework;
    this.projectDetails = projectDetails;
  }

  /**
   * Create standard project directories
   */
  async createDirectories() {
    const directories = [
      '.github/workflows',
      'terraform',
      'docker',
    ];

    for (const dir of directories) {
      const dirPath = join(this.projectPath, dir);
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
    }
  }

  /**
   * Add environment variables template
   */
  async addEnvTemplate() {
    const envTemplate = `# Application
NODE_ENV=production
PORT=${this.projectDetails.frameworkConfig.port || 3000}

# Database (optional)
# DATABASE_URL=

# Authentication (optional)
# NEXTAUTH_URL=
# NEXTAUTH_SECRET=

# External APIs
# API_KEY=

# Monitoring (optional)
# SENTRY_DSN=
# DATADOG_API_KEY=
`;

    await writeFile(join(this.projectPath, '.env.example'), envTemplate);
    await writeFile(join(this.projectPath, '.env.local'), envTemplate);
  }

  /**
   * Add security headers middleware (framework-specific implementation required)
   */
  async addSecurityHeaders() {
    // To be implemented by framework-specific processors
    logger.warn('Security headers not implemented for this framework');
  }

  /**
   * Run all common post-processing tasks
   */
  async process() {
    await this.createDirectories();
    
    if (this.projectDetails.features.includes('env-vars')) {
      await this.addEnvTemplate();
    }
  }
}

/**
 * Helper function to load framework-specific post-processor
 */
export async function loadPostProcessor(framework, projectPath, projectDetails) {
  try {
    const module = await import(`../${framework}/index.js`);
    const ProcessorClass = module.default || module.PostProcessor;
    return new ProcessorClass(projectPath, framework, projectDetails);
  } catch (error) {
    logger.warn(`No specific post-processor found for ${framework}, using base processor`);
    return new BasePostProcessor(projectPath, framework, projectDetails);
  }
}