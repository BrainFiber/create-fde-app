import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupDatadog(projectPath, framework) {
  console.log(chalk.blue('\n📊 Setting up Datadog Monitoring\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install Datadog packages
    execSync('yarn add dd-trace @datadog/browser-rum @datadog/browser-logs', { 
      cwd: projectPath,
      stdio: 'pipe'
    });

    spinner.succeed('Dependencies installed');

    // Create Datadog configuration
    spinner.start('Creating Datadog configuration...');
    await createDatadogConfig(projectPath, framework);
    spinner.succeed('Datadog configuration created');

    // Setup APM tracing
    spinner.start('Setting up APM tracing...');
    await setupAPMTracing(projectPath, framework);
    spinner.succeed('APM tracing configured');

    // Setup RUM (Real User Monitoring)
    spinner.start('Setting up RUM...');
    await setupRUM(projectPath, framework);
    spinner.succeed('RUM configured');

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    console.log(chalk.green('\n✅ Datadog setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Sign up for Datadog at https://www.datadoghq.com');
    console.log('2. Install Datadog Agent on your server');
    console.log('3. Update DD_* environment variables');
    console.log('4. Deploy and monitor your application\n');

  } catch (error) {
    spinner.fail('Datadog setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function createDatadogConfig(projectPath, framework) {
  const libDir = join(projectPath, 'lib', 'monitoring');
  if (!existsSync(libDir)) {
    mkdirSync(libDir, { recursive: true });
  }

  const datadogConfig = `export const datadogConfig = {
  // APM Configuration
  apm: {
    enabled: process.env.DD_APM_ENABLED === 'true',
    env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
    service: process.env.DD_SERVICE || 'my-app',
    version: process.env.DD_VERSION || '1.0.0',
    sampleRate: parseFloat(process.env.DD_TRACE_SAMPLE_RATE || '1'),
    logInjection: true,
    runtimeMetrics: true,
    profiling: process.env.NODE_ENV === 'production',
  },
  
  // RUM Configuration
  rum: {
    applicationId: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID || '',
    clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN || '',
    site: process.env.NEXT_PUBLIC_DD_SITE || 'datadoghq.com',
    service: process.env.NEXT_PUBLIC_DD_SERVICE || 'my-app-frontend',
    env: process.env.NEXT_PUBLIC_DD_ENV || process.env.NODE_ENV || 'development',
    version: process.env.NEXT_PUBLIC_DD_VERSION || '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: parseFloat(process.env.NEXT_PUBLIC_DD_RUM_REPLAY_SAMPLE_RATE || '20'),
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  },
  
  // Logs Configuration
  logs: {
    forwardErrorsToLogs: true,
    forwardConsoleLogs: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : 'all',
    forwardReports: 'all',
  },
  
  // Custom tags
  tags: {
    team: process.env.DD_TAGS_TEAM || 'engineering',
    component: process.env.DD_TAGS_COMPONENT || 'web',
  },
};

// Helper to check if monitoring is enabled
export function isMonitoringEnabled() {
  return process.env.DD_ENABLED !== 'false';
}

// Helper to get service name with environment
export function getServiceName(suffix?: string) {
  const base = datadogConfig.apm.service;
  const env = datadogConfig.apm.env;
  return suffix ? \`\${base}-\${suffix}-\${env}\` : \`\${base}-\${env}\`;
}
`;

  writeFileSync(join(libDir, 'datadog-config.ts'), datadogConfig);
}

async function setupAPMTracing(projectPath, framework) {
  const libDir = join(projectPath, 'lib', 'monitoring');

  // Create tracer initialization
  const tracerInit = `import tracer from 'dd-trace';
import { datadogConfig, isMonitoringEnabled } from './datadog-config';

let initialized = false;

export function initializeDatadogAPM() {
  if (initialized || !isMonitoringEnabled() || typeof window !== 'undefined') {
    return;
  }

  tracer.init({
    env: datadogConfig.apm.env,
    service: datadogConfig.apm.service,
    version: datadogConfig.apm.version,
    logInjection: datadogConfig.apm.logInjection,
    runtimeMetrics: datadogConfig.apm.runtimeMetrics,
    profiling: datadogConfig.apm.profiling,
    sampleRate: datadogConfig.apm.sampleRate,
    tags: datadogConfig.tags,
  });

  initialized = true;
  console.log('Datadog APM initialized');
}

// Custom span creation
export function createSpan(operation: string, tags?: Record<string, any>) {
  if (!isMonitoringEnabled()) return null;
  
  const span = tracer.startSpan(operation);
  if (tags) {
    Object.entries(tags).forEach(([key, value]) => {
      span.setTag(key, value);
    });
  }
  return span;
}

// Trace async operations
export async function traceAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  tags?: Record<string, any>
): Promise<T> {
  if (!isMonitoringEnabled()) return fn();
  
  const span = createSpan(operation, tags);
  try {
    const result = await fn();
    span?.setTag('result', 'success');
    return result;
  } catch (error) {
    span?.setTag('error', true);
    span?.setTag('error.message', (error as Error).message);
    throw error;
  } finally {
    span?.finish();
  }
}

// Trace API routes
export function traceAPIRoute(routeName: string) {
  return function decorator(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return traceAsync(\`api.\${routeName}\`, async () => {
        return originalMethod.apply(this, args);
      });
    };
    
    return descriptor;
  };
}
`;

  writeFileSync(join(libDir, 'apm.ts'), tracerInit);

  if (framework === 'nextjs') {
    // Create instrumentation file for Next.js
    const instrumentation = `import { initializeDatadogAPM } from './lib/monitoring/apm';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initializeDatadogAPM();
  }
}
`;

    writeFileSync(join(projectPath, 'instrumentation.ts'), instrumentation);

    // Create middleware for request tracing
    const middleware = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSpan } from '@/lib/monitoring/apm';

export function datadogMiddleware(request: NextRequest) {
  const span = createSpan('http.request', {
    'http.method': request.method,
    'http.url': request.url,
    'http.path': request.nextUrl.pathname,
  });

  const response = NextResponse.next();
  
  span?.setTag('http.status_code', response.status);
  span?.finish();

  return response;
}
`;

    writeFileSync(join(libDir, 'middleware.ts'), middleware);
  }
}

async function setupRUM(projectPath, framework) {
  const libDir = join(projectPath, 'lib', 'monitoring');

  // Create RUM initialization
  const rumInit = `import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';
import { datadogConfig, isMonitoringEnabled } from './datadog-config';

let initialized = false;

export function initializeDatadogRUM() {
  if (initialized || !isMonitoringEnabled() || typeof window === 'undefined') {
    return;
  }

  const config = datadogConfig.rum;
  
  if (!config.applicationId || !config.clientToken) {
    console.warn('Datadog RUM credentials not configured');
    return;
  }

  // Initialize RUM
  datadogRum.init({
    applicationId: config.applicationId,
    clientToken: config.clientToken,
    site: config.site,
    service: config.service,
    env: config.env,
    version: config.version,
    sessionSampleRate: config.sessionSampleRate,
    sessionReplaySampleRate: config.sessionReplaySampleRate,
    trackUserInteractions: config.trackUserInteractions,
    trackResources: config.trackResources,
    trackLongTasks: config.trackLongTasks,
    defaultPrivacyLevel: config.defaultPrivacyLevel,
  });

  // Initialize Logs
  datadogLogs.init({
    clientToken: config.clientToken,
    site: config.site,
    service: config.service,
    env: config.env,
    version: config.version,
    forwardErrorsToLogs: datadogConfig.logs.forwardErrorsToLogs,
    forwardConsoleLogs: datadogConfig.logs.forwardConsoleLogs,
    forwardReports: datadogConfig.logs.forwardReports,
  });

  // Start session replay recording
  datadogRum.startSessionReplayRecording();

  initialized = true;
  console.log('Datadog RUM initialized');
}

// Custom RUM actions
export function trackUserAction(name: string, context?: Record<string, any>) {
  if (!isMonitoringEnabled()) return;
  datadogRum.addAction(name, context);
}

export function trackError(error: Error, context?: Record<string, any>) {
  if (!isMonitoringEnabled()) return;
  datadogRum.addError(error, context);
}

export function trackTiming(name: string, duration: number) {
  if (!isMonitoringEnabled()) return;
  datadogRum.addTiming(name, duration);
}

export function setUser(user: { id: string; name?: string; email?: string }) {
  if (!isMonitoringEnabled()) return;
  datadogRum.setUser({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}

export function addRumGlobalContext(key: string, value: any) {
  if (!isMonitoringEnabled()) return;
  datadogRum.addRumGlobalContext(key, value);
}

// React Error Boundary integration
export function logErrorToDatadog(error: Error, errorInfo: any) {
  if (!isMonitoringEnabled()) return;
  
  datadogLogs.logger.error('React Error Boundary', {
    error: {
      message: error.message,
      stack: error.stack,
    },
    errorInfo,
  });
  
  trackError(error, { source: 'error-boundary' });
}
`;

  writeFileSync(join(libDir, 'rum.ts'), rumInit);

  // Create RUM provider component
  const providerDir = join(projectPath, 'app', 'providers');
  if (!existsSync(providerDir)) {
    mkdirSync(providerDir, { recursive: true });
  }

  const rumProvider = `'use client';

import { useEffect } from 'react';
import { initializeDatadogRUM } from '@/lib/monitoring/rum';

export function DatadogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeDatadogRUM();
  }, []);

  return <>{children}</>;
}
`;

  writeFileSync(join(providerDir, 'datadog.tsx'), rumProvider);

  // Create example monitored components
  const componentsDir = join(projectPath, 'app', 'components', 'monitoring');
  if (!existsSync(componentsDir)) {
    mkdirSync(componentsDir, { recursive: true });
  }

  const monitoredButton = `'use client';

import { trackUserAction } from '@/lib/monitoring/rum';

interface MonitoredButtonProps {
  action: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MonitoredButton({ action, children, onClick, className }: MonitoredButtonProps) {
  const handleClick = () => {
    trackUserAction(\`button_click:\${action}\`, {
      component: 'MonitoredButton',
      timestamp: new Date().toISOString(),
    });
    onClick?.();
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
`;

  writeFileSync(join(componentsDir, 'monitored-button.tsx'), monitoredButton);

  const performanceMonitor = `'use client';

import { useEffect } from 'react';
import { trackTiming } from '@/lib/monitoring/rum';

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

export function PerformanceMonitor({ componentName, children }: PerformanceMonitorProps) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      trackTiming(\`component_render:\${componentName}\`, duration);
    };
  }, [componentName]);

  return <>{children}</>;
}
`;

  writeFileSync(join(componentsDir, 'performance-monitor.tsx'), performanceMonitor);
}

async function updateEnvVariables(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  const datadogEnvVars = `
# Datadog Configuration
DD_ENABLED=true
DD_ENV=development
DD_SERVICE=my-app
DD_VERSION=1.0.0
DD_LOGS_INJECTION=true
DD_RUNTIME_METRICS_ENABLED=true
DD_TRACE_SAMPLE_RATE=1
DD_APM_ENABLED=true

# Datadog RUM (Real User Monitoring)
NEXT_PUBLIC_DD_RUM_APPLICATION_ID=
NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN=
NEXT_PUBLIC_DD_SITE=datadoghq.com
NEXT_PUBLIC_DD_SERVICE=my-app-frontend
NEXT_PUBLIC_DD_ENV=development
NEXT_PUBLIC_DD_VERSION=1.0.0
NEXT_PUBLIC_DD_RUM_REPLAY_SAMPLE_RATE=20

# Datadog Tags
DD_TAGS_TEAM=engineering
DD_TAGS_COMPONENT=web
`;

  if (!envContent.includes('DD_ENABLED')) {
    envContent += datadogEnvVars;
    writeFileSync(envExamplePath, envContent);
  }
}