import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupLogging(projectPath, framework) {
  console.log(chalk.blue('\n📝 Setting up Logging System\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install Winston and related packages
    execSync('npm install winston winston-daily-rotate-file', { 
      cwd: projectPath,
      stdio: 'pipe'
    });

    // Install framework-specific packages
    if (framework === 'nextjs') {
      execSync('npm install next-logger', { 
        cwd: projectPath,
        stdio: 'pipe'
      });
    }

    spinner.succeed('Dependencies installed');

    // Create logging configuration
    spinner.start('Creating logging configuration...');
    await createLoggingConfig(projectPath, framework);
    spinner.succeed('Logging configuration created');

    // Create log utilities
    spinner.start('Creating log utilities...');
    await createLogUtilities(projectPath, framework);
    spinner.succeed('Log utilities created');

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    console.log(chalk.green('\n✅ Logging setup complete!\n'));
    console.log(chalk.yellow('Usage:'));
    console.log('  import { logger } from "@/lib/logger";');
    console.log('  logger.info("Application started");');
    console.log('  logger.error("Error occurred", { error });');
    console.log('\nLogs will be saved to the logs/ directory\n');

  } catch (error) {
    spinner.fail('Logging setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function createLoggingConfig(projectPath, framework) {
  const libDir = join(projectPath, 'lib');
  if (!existsSync(libDir)) {
    mkdirSync(libDir, { recursive: true });
  }

  const loggerConfig = `import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = \`\${timestamp} [\${level}]: \${message}\`;
  if (Object.keys(metadata).length > 0) {
    msg += \` \${JSON.stringify(metadata)}\`;
  }
  return msg;
});

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Create transports
const transports: winston.transport[] = [];

// Console transport
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: combine(
        timestamp(),
        json()
      ),
    })
  );
}

// File transports
const fileLogFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Error log file
transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: fileLogFormat,
  })
);

// Combined log file
transports.push(
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileLogFormat,
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export function logRequest(req: any, res: any, responseTime: number) {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: \`\${responseTime}ms\`,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
  });
}

export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context,
  });
}

export function logDatabase(operation: string, model: string, duration: number, success: boolean) {
  const level = success ? 'info' : 'error';
  logger.log(level, 'Database Operation', {
    operation,
    model,
    duration: \`\${duration}ms\`,
    success,
  });
}

export function logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
  logger.info('Performance Metric', {
    operation,
    duration: \`\${duration}ms\`,
    ...metadata,
  });
}

// Graceful shutdown
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
`;

  writeFileSync(join(libDir, 'logger.ts'), loggerConfig);

  // Add logs directory to .gitignore
  const gitignorePath = join(projectPath, '.gitignore');
  if (existsSync(gitignorePath)) {
    let gitignore = readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('logs/')) {
      gitignore += '\n# Logs\nlogs/\n*.log\n';
      writeFileSync(gitignorePath, gitignore);
    }
  }
}

async function createLogUtilities(projectPath, framework) {
  // Create middleware for request logging
  const middlewareDir = join(projectPath, 'middleware');
  if (!existsSync(middlewareDir)) {
    mkdirSync(middlewareDir, { recursive: true });
  }

  if (framework === 'nextjs') {
    const loggingMiddleware = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams),
  });

  // Continue with the request
  const response = NextResponse.next();

  // Log response time
  const duration = Date.now() - start;
  logger.info('Request completed', {
    method: request.method,
    pathname: request.nextUrl.pathname,
    duration: \`\${duration}ms\`,
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
`;

    writeFileSync(join(projectPath, 'middleware-logging.ts'), loggingMiddleware);
  }

  // Create API logging wrapper
  const apiUtilsDir = join(projectPath, 'lib', 'api');
  if (!existsSync(apiUtilsDir)) {
    mkdirSync(apiUtilsDir, { recursive: true });
  }

  const apiLogger = `import { logger, logError } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export function withLogging(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    const start = Date.now();
    const { pathname, searchParams } = new URL(req.url);

    try {
      logger.info('API Request', {
        method: req.method,
        pathname,
        searchParams: Object.fromEntries(searchParams),
      });

      const response = await handler(req);
      const duration = Date.now() - start;

      logger.info('API Response', {
        method: req.method,
        pathname,
        status: response.status,
        duration: \`\${duration}ms\`,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      logError(error as Error, {
        method: req.method,
        pathname,
        duration: \`\${duration}ms\`,
      });

      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

// Example usage:
// export const GET = withLogging(async (req) => {
//   // Your API logic here
//   return NextResponse.json({ data: 'example' });
// });
`;

  writeFileSync(join(apiUtilsDir, 'with-logging.ts'), apiLogger);

  // Create example logged API route
  const exampleApiDir = join(projectPath, 'app', 'api', 'logged-example');
  if (!existsSync(exampleApiDir)) {
    mkdirSync(exampleApiDir, { recursive: true });
  }

  const exampleApi = `import { NextRequest, NextResponse } from 'next/server';
import { withLogging } from '@/lib/api/with-logging';
import { logger } from '@/lib/logger';

export const GET = withLogging(async (req: NextRequest) => {
  // Example of logging within the API
  logger.info('Processing example request');
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Log custom metrics
  logger.info('Custom metric', {
    metric: 'example_processed',
    value: 1,
  });
  
  return NextResponse.json({
    message: 'This is a logged API endpoint',
    timestamp: new Date().toISOString(),
  });
});
`;

  writeFileSync(join(exampleApiDir, 'route.ts'), exampleApi);
}

async function updateEnvVariables(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  const loggingEnvVars = `
# Logging Configuration
LOG_LEVEL=info # Options: error, warn, info, http, debug
`;

  if (!envContent.includes('LOG_LEVEL')) {
    envContent += loggingEnvVars;
    writeFileSync(envExamplePath, envContent);
  }
}