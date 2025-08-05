import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { BasePostProcessor } from '../common/index.js';
import { logger } from '../../lib/utils/logger.js';

export default class RemixPostProcessor extends BasePostProcessor {
  /**
   * Add Remix health check route
   */
  async addHealthCheck() {
    const routesDir = join(this.projectPath, 'app', 'routes');
    await mkdir(routesDir, { recursive: true });
    
    const healthCheckContent = `import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    framework: 'remix',
    version: process.env.npm_package_version || 'unknown'
  });
};`;

    await writeFile(
      join(routesDir, 'api.health.tsx'),
      healthCheckContent
    );
    
    logger.info('Added Remix health check endpoint at /api/health');
  }

  /**
   * Add Remix-specific security headers
   */
  async addSecurityHeaders() {
    const entryServerPath = join(this.projectPath, 'app', 'entry.server.tsx');
    
    if (existsSync(entryServerPath)) {
      let entryContent = await readFile(entryServerPath, 'utf-8');
      
      // Add security headers middleware
      const securityMiddleware = `
// Security headers middleware
function addSecurityHeaders(headers: Headers) {
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  return headers;
}
`;

      // Insert security middleware after imports
      if (!entryContent.includes('addSecurityHeaders')) {
        const importEndIndex = entryContent.lastIndexOf('import');
        const nextLineIndex = entryContent.indexOf('\n', importEndIndex);
        entryContent = 
          entryContent.slice(0, nextLineIndex + 1) +
          securityMiddleware +
          entryContent.slice(nextLineIndex + 1);

        // Update handleRequest to use security headers
        entryContent = entryContent.replace(
          /return new Response\(responseBody, \{([^}]+)\}\)/,
          'return new Response(responseBody, { $1, headers: addSecurityHeaders(responseHeaders) })'
        );

        await writeFile(entryServerPath, entryContent);
        logger.info('Added security headers to entry.server.tsx');
      }
    }
  }

  /**
   * Add Remix-specific environment configuration
   */
  async addEnvTemplate() {
    const envTemplate = `# Application
NODE_ENV=production
PORT=3000

# Session
SESSION_SECRET=your-session-secret-here

# Database (optional)
# DATABASE_URL=

# Authentication (optional)
# AUTH_SECRET=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# External APIs
# API_KEY=
# API_BASE_URL=

# Monitoring (optional)
# SENTRY_DSN=
`;

    await writeFile(join(this.projectPath, '.env.example'), envTemplate);
    await writeFile(join(this.projectPath, '.env'), envTemplate);
  }

  /**
   * Add error boundary for production
   */
  async addErrorBoundary() {
    const rootPath = join(this.projectPath, 'app', 'root.tsx');
    
    if (existsSync(rootPath)) {
      let rootContent = await readFile(rootPath, 'utf-8');
      
      const errorBoundary = `
export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <html>
        <head>
          <title>{error.status} {error.statusText}</title>
          <Meta />
          <Links />
        </head>
        <body>
          <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
            <h1>{error.status} {error.statusText}</h1>
            <p>{error.data}</p>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }
  
  return (
    <html>
      <head>
        <title>Error!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
          <h1>Application Error</h1>
          <p>Sorry, an unexpected error occurred.</p>
          {process.env.NODE_ENV === "development" && (
            <pre style={{ textAlign: "left", background: "#f0f0f0", padding: "1rem", overflow: "auto" }}>
              {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
        <Scripts />
      </body>
    </html>
  );
}`;

      // Add necessary imports
      if (!rootContent.includes('useRouteError')) {
        rootContent = rootContent.replace(
          'from "@remix-run/react"',
          'from "@remix-run/react";\nimport { isRouteErrorResponse, useRouteError } from "@remix-run/react"'
        );
      }

      // Add error boundary if not exists
      if (!rootContent.includes('export function ErrorBoundary')) {
        rootContent += errorBoundary;
        await writeFile(rootPath, rootContent);
        logger.info('Added error boundary to root.tsx');
      }
    }
  }

  /**
   * Add production build optimizations
   */
  async addBuildOptimizations() {
    const remixConfigPath = join(this.projectPath, 'remix.config.js');
    
    if (existsSync(remixConfigPath)) {
      let configContent = await readFile(remixConfigPath, 'utf-8');
      
      // Add production optimizations
      const optimizations = `
  // Production optimizations
  serverModuleFormat: "cjs",
  serverMinify: process.env.NODE_ENV === "production",
  
  // Future flags for better performance
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },`;

      if (!configContent.includes('serverMinify')) {
        configContent = configContent.replace(
          'module.exports = {',
          `module.exports = {${optimizations}`
        );
        await writeFile(remixConfigPath, configContent);
        logger.info('Added build optimizations to remix.config.js');
      }
    }
  }

  /**
   * Run all Remix-specific post-processing tasks
   */
  async process() {
    // Run common tasks first
    await super.process();

    // Run Remix-specific tasks
    if (this.projectDetails.features.includes('health-check')) {
      await this.addHealthCheck();
    }

    if (this.projectDetails.features.includes('security')) {
      await this.addSecurityHeaders();
    }

    if (this.projectDetails.features.includes('production-ready')) {
      await this.addErrorBoundary();
      await this.addBuildOptimizations();
    }

    logger.success('Remix post-processing completed');
  }
}