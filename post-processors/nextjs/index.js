import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { BasePostProcessor } from '../common/index.js';
import { logger } from '../../lib/utils/logger.js';

export default class NextPostProcessor extends BasePostProcessor {
  /**
   * Add Next.js health check endpoint
   */
  async addHealthCheck() {
    const appApiDir = join(this.projectPath, 'src', 'app', 'api', 'health');
    const pagesApiDir = join(this.projectPath, 'pages', 'api');
    
    // Check if using app directory
    if (existsSync(join(this.projectPath, 'src', 'app'))) {
      await mkdir(appApiDir, { recursive: true });
      
      const healthCheckContent = `export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    framework: 'nextjs',
    version: process.env.npm_package_version || 'unknown'
  });
}`;

      await writeFile(
        join(appApiDir, 'route.ts'),
        healthCheckContent
      );
      logger.info('Added Next.js App Router health check endpoint at /api/health');
    } else if (existsSync(join(this.projectPath, 'pages')) || !existsSync(join(this.projectPath, 'src'))) {
      // Pages directory
      await mkdir(pagesApiDir, { recursive: true });
      
      const healthCheckContent = `import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    framework: 'nextjs',
    version: process.env.npm_package_version || 'unknown'
  });
}`;

      await writeFile(
        join(pagesApiDir, 'health.ts'),
        healthCheckContent
      );
      logger.info('Added Next.js Pages Router health check endpoint at /api/health');
    }
  }

  /**
   * Add Next.js-specific security headers
   */
  async addSecurityHeaders() {
    const nextConfigPath = join(this.projectPath, 'next.config.js');
    
    if (existsSync(nextConfigPath)) {
      let configContent = await readFile(nextConfigPath, 'utf-8');
      
      const securityHeaders = `
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }] : [])
        ]
      }
    ]
  },`;

      // Insert security headers into the config
      if (!configContent.includes('headers()')) {
        configContent = configContent.replace(
          /module\.exports = {/,
          `module.exports = {${securityHeaders}`
        );
        await writeFile(nextConfigPath, configContent);
        logger.info('Added security headers to next.config.js');
      }
    }
  }

  /**
   * Add Next.js-specific environment configuration
   */
  async addEnvTemplate() {
    const envTemplate = `# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=/api

# Database (optional)
# DATABASE_URL=

# Authentication (optional)
# NEXTAUTH_URL=
# NEXTAUTH_SECRET=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# External APIs
# API_KEY=
# NEXT_PUBLIC_API_KEY=

# Monitoring (optional)
# SENTRY_DSN=
# NEXT_PUBLIC_SENTRY_DSN=
# NEXT_PUBLIC_VERCEL_ENV=
`;

    await writeFile(join(this.projectPath, '.env.example'), envTemplate);
    await writeFile(join(this.projectPath, '.env.local'), envTemplate);
  }

  /**
   * Add custom error pages
   */
  async addErrorPages() {
    const appDir = join(this.projectPath, 'src', 'app');
    const pagesDir = join(this.projectPath, 'pages');
    
    if (existsSync(appDir)) {
      // App Router error page
      const errorContent = `'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>Something went wrong!</h1>
      <button
        onClick={() => reset()}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}`;

      await writeFile(join(appDir, 'error.tsx'), errorContent);
      logger.info('Added App Router error page');
    } else if (existsSync(pagesDir) || !existsSync(join(this.projectPath, 'src'))) {
      // Pages Router error pages
      await mkdir(pagesDir, { recursive: true });
      
      const error404Content = `export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}`;

      const error500Content = `export default function Custom500() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>500 - Server Error</h1>
      <p>Sorry, something went wrong on our end.</p>
    </div>
  );
}`;

      await writeFile(join(pagesDir, '404.tsx'), error404Content);
      await writeFile(join(pagesDir, '500.tsx'), error500Content);
      logger.info('Added Pages Router error pages');
    }
  }

  /**
   * Add production optimizations
   */
  async addProductionOptimizations() {
    const nextConfigPath = join(this.projectPath, 'next.config.js');
    
    if (existsSync(nextConfigPath)) {
      let configContent = await readFile(nextConfigPath, 'utf-8');
      
      const optimizations = `
  // Production optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: process.env.ALLOWED_IMAGE_DOMAINS?.split(',') || [],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
  },`;

      if (!configContent.includes('swcMinify')) {
        configContent = configContent.replace(
          /module\.exports = {/,
          `module.exports = {${optimizations}`
        );
        await writeFile(nextConfigPath, configContent);
        logger.info('Added production optimizations to next.config.js');
      }
    }
  }

  /**
   * Run all Next.js-specific post-processing tasks
   */
  async process() {
    // Run common tasks first
    await super.process();

    // Run Next.js-specific tasks
    if (this.projectDetails.features.includes('health-check')) {
      await this.addHealthCheck();
    }

    if (this.projectDetails.features.includes('security')) {
      await this.addSecurityHeaders();
    }

    if (this.projectDetails.features.includes('production-ready')) {
      await this.addErrorPages();
      await this.addProductionOptimizations();
    }

    logger.success('Next.js post-processing completed');
  }
}