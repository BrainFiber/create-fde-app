import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupSentry(projectPath, framework) {
  console.log(chalk.blue('\n🛡️  Setting up Sentry Error Tracking\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install Sentry SDK based on framework
    const packages = framework === 'nextjs' 
      ? '@sentry/nextjs'
      : framework === 'nuxtjs'
      ? '@nuxtjs/sentry'
      : '@sentry/node @sentry/integrations';
    
    execSync(`npm install ${packages}`, { 
      cwd: projectPath,
      stdio: 'pipe'
    });

    spinner.succeed('Dependencies installed');

    // Framework-specific setup
    if (framework === 'nextjs') {
      await setupSentryNextJS(projectPath);
    } else if (framework === 'nuxtjs') {
      await setupSentryNuxt(projectPath);
    } else if (framework === 'remix') {
      await setupSentryRemix(projectPath);
    }

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    console.log(chalk.green('\n✅ Sentry setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Create a project at https://sentry.io');
    console.log('2. Update SENTRY_DSN in .env');
    console.log('3. Run `npx sentry-wizard` for additional configuration');
    console.log('4. Test error tracking by throwing an error\n');

  } catch (error) {
    spinner.fail('Sentry setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function setupSentryNextJS(projectPath) {
  const spinner = ora('Setting up Sentry for Next.js...').start();

  // Create Sentry configuration files
  const sentryClientConfig = `import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  environment: process.env.NODE_ENV,
  
  // Filtering
  ignoreErrors: [
    // Browser errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Network errors
    'NetworkError',
    'Failed to fetch',
  ],
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
`;

  writeFileSync(join(projectPath, 'sentry.client.config.ts'), sentryClientConfig);

  const sentryServerConfig = `import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  environment: process.env.NODE_ENV,
  
  // Server-specific options
  autoSessionTracking: false,
  
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
`;

  writeFileSync(join(projectPath, 'sentry.server.config.ts'), sentryServerConfig);

  const sentryEdgeConfig = `import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NODE_ENV,
});
`;

  writeFileSync(join(projectPath, 'sentry.edge.config.ts'), sentryEdgeConfig);

  // Create next.config.js modification script
  const nextConfigUpdate = `
// Add this to your next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

module.exports = withSentryConfig(
  yourExistingNextConfig,
  sentryWebpackPluginOptions
);
`;

  // Create error boundary component
  const errorBoundaryDir = join(projectPath, 'app', 'components');
  if (!existsSync(errorBoundaryDir)) {
    mkdirSync(errorBoundaryDir, { recursive: true });
  }

  const errorBoundary = `'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">
          We've been notified and are working to fix the issue.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
`;

  writeFileSync(join(errorBoundaryDir, 'error-boundary.tsx'), errorBoundary);

  // Create example error page
  const errorTestDir = join(projectPath, 'app', 'test-error');
  if (!existsSync(errorTestDir)) {
    mkdirSync(errorTestDir, { recursive: true });
  }

  const errorTestPage = `'use client';

import * as Sentry from '@sentry/nextjs';

export default function TestError() {
  const throwError = () => {
    throw new Error('Test error for Sentry');
  };

  const captureMessage = () => {
    Sentry.captureMessage('Test message from Sentry', 'info');
    alert('Message sent to Sentry!');
  };

  const captureException = () => {
    try {
      throw new Error('Captured exception');
    } catch (error) {
      Sentry.captureException(error);
      alert('Exception sent to Sentry!');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Error Testing</h1>
      <div className="space-y-4">
        <button
          onClick={throwError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Throw Error (Will crash page)
        </button>
        <button
          onClick={captureMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Send Test Message
        </button>
        <button
          onClick={captureException}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Capture Exception
        </button>
      </div>
    </div>
  );
}
`;

  writeFileSync(join(errorTestDir, 'page.tsx'), errorTestPage);

  // Create API monitoring example
  const apiDir = join(projectPath, 'app', 'api', 'monitored');
  if (!existsSync(apiDir)) {
    mkdirSync(apiDir, { recursive: true });
  }

  const monitoredApi = `import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  const transaction = Sentry.startTransaction({
    op: 'api',
    name: 'GET /api/monitored',
  });

  try {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add custom context
    Sentry.setContext('api_response', {
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      message: 'API is being monitored by Sentry' 
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    transaction.finish();
  }
}
`;

  writeFileSync(join(apiDir, 'route.ts'), monitoredApi);

  spinner.succeed('Sentry Next.js setup complete');
}

async function setupSentryNuxt(projectPath) {
  const spinner = ora('Setting up Sentry for Nuxt.js...').start();

  // Update nuxt.config.ts
  const nuxtConfigAddition = `
// Add to nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sentry'],
  
  sentry: {
    dsn: process.env.SENTRY_DSN,
    disabled: process.env.NODE_ENV === 'development',
    config: {
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    },
  },
});
`;

  // Create plugins for additional configuration
  const pluginsDir = join(projectPath, 'plugins');
  if (!existsSync(pluginsDir)) {
    mkdirSync(pluginsDir, { recursive: true });
  }

  const sentryPlugin = `export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:error', (error, instance, info) => {
    const { $sentry } = nuxtApp;
    $sentry.captureException(error, {
      extra: { info },
    });
  });
});
`;

  writeFileSync(join(pluginsDir, 'sentry.client.ts'), sentryPlugin);

  spinner.succeed('Sentry Nuxt.js setup complete');
}

async function setupSentryRemix(projectPath) {
  const spinner = ora('Setting up Sentry for Remix...').start();

  // Create entry files
  const entryClient = `import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: window.ENV.SENTRY_DSN,
  tracesSampleRate: window.ENV.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.remixRouterInstrumentation(
        useEffect,
        useLocation,
        useMatches
      ),
    }),
    new Sentry.Replay(),
  ],
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
`;

  const entryServer = `import { PassThrough } from 'stream';
import type { EntryContext } from '@remix-run/node';
import { Response } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { renderToPipeableStream } from 'react-dom/server';
import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
});

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onShellReady() {
          const body = new PassThrough();
          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(err: unknown) {
          reject(err);
        },
        onError(error: unknown) {
          didError = true;
          Sentry.captureException(error);
          console.error(error);
        },
      }
    );

    setTimeout(abort, 5000);
  });
}

export function handleError(error: unknown, { request }: { request: Request }) {
  Sentry.captureRemixServerException(error, 'remix.server', request);
}
`;

  // Note: These would overwrite existing entry files
  console.log(chalk.yellow('\nNote: Add Sentry initialization to your entry files manually'));

  spinner.succeed('Sentry Remix setup complete');
}

async function updateEnvVariables(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  const sentryEnvVars = `
# Sentry Error Tracking
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
`;

  if (!envContent.includes('SENTRY_DSN')) {
    envContent += sentryEnvVars;
    writeFileSync(envExamplePath, envContent);
  }
}