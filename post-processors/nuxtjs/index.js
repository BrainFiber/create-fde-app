import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { BasePostProcessor } from '../common/index.js';
import { logger } from '../../lib/utils/logger.js';

export default class NuxtPostProcessor extends BasePostProcessor {
  /**
   * Add Nuxt.js health check endpoint
   */
  async addHealthCheck() {
    // Check if using Nuxt 3
    const serverApiDir = join(this.projectPath, 'server', 'api');
    await mkdir(serverApiDir, { recursive: true });
    
    const healthCheckContent = `export default defineEventHandler((event) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    framework: 'nuxtjs',
    version: process.env.npm_package_version || 'unknown'
  }
})`;

    await writeFile(
      join(serverApiDir, 'health.js'),
      healthCheckContent
    );
    
    logger.info('Added Nuxt.js health check endpoint at /api/health');
  }

  /**
   * Add Nuxt-specific security configuration
   */
  async addSecurityHeaders() {
    const nuxtConfigPath = join(this.projectPath, 'nuxt.config.ts');
    
    if (existsSync(nuxtConfigPath)) {
      let configContent = await readFile(nuxtConfigPath, 'utf-8');
      
      // Add security headers to nuxt.config.ts
      const securityHeaders = `
  // Security headers
  nitro: {
    security: {
      headers: {
        contentSecurityPolicy: {
          'img-src': ["'self'", 'data:', 'https:'],
          'font-src': ["'self'", 'https:', 'data:'],
        },
        crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp',
        strictTransportSecurity: {
          maxAge: 31536000,
          includeSubdomains: true,
        },
        xContentTypeOptions: 'nosniff',
        xFrameOptions: 'SAMEORIGIN',
        xXSSProtection: '1; mode=block',
      }
    }
  },`;

      // Insert security headers before the closing bracket
      if (!configContent.includes('nitro:')) {
        configContent = configContent.replace(
          /export default defineNuxtConfig\({/,
          `export default defineNuxtConfig({${securityHeaders}`
        );
        await writeFile(nuxtConfigPath, configContent);
        logger.info('Added security headers to nuxt.config.ts');
      }
    }
  }

  /**
   * Add Nuxt-specific environment configuration
   */
  async addEnvTemplate() {
    const envTemplate = `# Application
NODE_ENV=production
PORT=3000
NUXT_PUBLIC_API_BASE=/api

# Database (optional)
# DATABASE_URL=

# Authentication (optional)
# NUXT_AUTH_SECRET=
# NUXT_GOOGLE_CLIENT_ID=
# NUXT_GOOGLE_CLIENT_SECRET=

# External APIs
# NUXT_API_KEY=

# Monitoring (optional)
# SENTRY_DSN=
# NUXT_PUBLIC_SENTRY_DSN=
`;

    await writeFile(join(this.projectPath, '.env.example'), envTemplate);
    await writeFile(join(this.projectPath, '.env'), envTemplate);
  }

  /**
   * Add production optimization settings
   */
  async addProductionOptimizations() {
    // Create a server plugin for runtime optimizations
    const pluginsDir = join(this.projectPath, 'server', 'plugins');
    await mkdir(pluginsDir, { recursive: true });

    const optimizationPlugin = `export default defineNitroPlugin((nitroApp) => {
  // Enable compression
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    setHeader(event, 'x-powered-by', 'Nuxt 3')
  })
  
  // Add cache headers for static assets
  nitroApp.hooks.hook('beforeResponse', (event, response) => {
    const url = event.node.req.url
    if (url && (url.includes('/_nuxt/') || url.includes('/assets/'))) {
      setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
    }
  })
})`;

    await writeFile(
      join(pluginsDir, 'optimization.js'),
      optimizationPlugin
    );
  }

  /**
   * Run all Nuxt-specific post-processing tasks
   */
  async process() {
    // Run common tasks first
    await super.process();

    // Run Nuxt-specific tasks
    if (this.projectDetails.features.includes('health-check')) {
      await this.addHealthCheck();
    }

    if (this.projectDetails.features.includes('security')) {
      await this.addSecurityHeaders();
    }

    if (this.projectDetails.features.includes('production-ready')) {
      await this.addProductionOptimizations();
    }

    logger.success('Nuxt.js post-processing completed');
  }
}