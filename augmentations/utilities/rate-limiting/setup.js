import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupRateLimiting(projectPath, framework) {
  console.log(chalk.blue('\n🚦 Setting up API Rate Limiting\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install rate limiting packages
    execSync('npm install express-rate-limit rate-limiter-flexible redis ioredis', { 
      cwd: projectPath,
      stdio: 'pipe'
    });

    spinner.succeed('Dependencies installed');

    // Create rate limiting configuration
    spinner.start('Creating rate limiting configuration...');
    await createRateLimitConfig(projectPath, framework);
    spinner.succeed('Rate limiting configuration created');

    // Create middleware
    spinner.start('Creating rate limiting middleware...');
    await createRateLimitMiddleware(projectPath, framework);
    spinner.succeed('Rate limiting middleware created');

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    console.log(chalk.green('\n✅ Rate limiting setup complete!\n'));
    console.log(chalk.yellow('Features included:'));
    console.log('  - IP-based rate limiting');
    console.log('  - API key rate limiting');
    console.log('  - Redis support for distributed systems');
    console.log('  - Customizable limits per endpoint\n');

  } catch (error) {
    spinner.fail('Rate limiting setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function createRateLimitConfig(projectPath, framework) {
  const libDir = join(projectPath, 'lib', 'rate-limit');
  if (!existsSync(libDir)) {
    mkdirSync(libDir, { recursive: true });
  }

  // Create Redis client
  const redisClient = `import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redis.on('connect', () => {
    console.log('Connected to Redis for rate limiting');
  });
}

export { redis };
`;

  writeFileSync(join(libDir, 'redis.ts'), redisClient);

  // Create rate limiter configuration
  const rateLimiterConfig = `import { RateLimiterMemory, RateLimiterRedis, IRateLimiterOptions } from 'rate-limiter-flexible';
import { redis } from './redis';

export interface RateLimitConfig {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds
}

export const defaultLimits: Record<string, RateLimitConfig> = {
  // General API limit
  api: {
    points: 100,
    duration: 60, // 100 requests per minute
    blockDuration: 60 * 5, // Block for 5 minutes
  },
  
  // Strict limit for auth endpoints
  auth: {
    points: 5,
    duration: 60 * 15, // 5 attempts per 15 minutes
    blockDuration: 60 * 30, // Block for 30 minutes
  },
  
  // Higher limit for authenticated users
  authenticated: {
    points: 1000,
    duration: 60 * 60, // 1000 requests per hour
  },
  
  // Specific endpoint limits
  upload: {
    points: 10,
    duration: 60 * 60, // 10 uploads per hour
  },
  
  search: {
    points: 30,
    duration: 60, // 30 searches per minute
  },
};

export function createRateLimiter(keyPrefix: string, config: RateLimitConfig) {
  const options: IRateLimiterOptions = {
    keyPrefix,
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  };

  if (redis) {
    return new RateLimiterRedis({
      storeClient: redis,
      ...options,
    });
  }

  // Fallback to memory store if Redis is not available
  console.warn('Redis not available, using in-memory rate limiting');
  return new RateLimiterMemory(options);
}

// Helper to get client identifier
export function getClientId(req: any): string {
  // Try to get API key first
  const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  if (apiKey) {
    return \`api_key:\${apiKey}\`;
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || req.connection?.remoteAddress;
  return \`ip:\${ip}\`;
}

// Rate limit response formatter
export function formatRateLimitResponse(rateLimiterRes: any) {
  return {
    'X-RateLimit-Limit': rateLimiterRes.points,
    'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
    'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
  };
}
`;

  writeFileSync(join(libDir, 'config.ts'), rateLimiterConfig);
}

async function createRateLimitMiddleware(projectPath, framework) {
  const middlewareDir = join(projectPath, 'lib', 'rate-limit');

  if (framework === 'nextjs') {
    // Create Next.js API route wrapper
    const nextjsMiddleware = `import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getClientId, formatRateLimitResponse, defaultLimits, RateLimitConfig } from './config';

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  customConfig?: RateLimitConfig
) {
  const config = customConfig || defaultLimits.api;
  const rateLimiter = createRateLimiter('nextjs_api', config);

  return async (req: NextRequest) => {
    try {
      const clientId = getClientId(req);
      const rateLimiterRes = await rateLimiter.consume(clientId);

      // Add rate limit headers to response
      const response = await handler(req);
      const headers = formatRateLimitResponse(rateLimiterRes);
      
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value.toString());
      });

      return response;
    } catch (rejRes: any) {
      // Rate limit exceeded
      const headers = formatRateLimitResponse(rejRes);
      
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rejRes.msBeforeNext / 1000,
        },
        {
          status: 429,
          headers: headers as any,
        }
      );
    }
  };
}

// Middleware for specific rate limit types
export const withAuthRateLimit = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, defaultLimits.auth);

export const withUploadRateLimit = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, defaultLimits.upload);

export const withSearchRateLimit = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, defaultLimits.search);
`;

    writeFileSync(join(middlewareDir, 'middleware.ts'), nextjsMiddleware);

    // Create edge middleware for global rate limiting
    const edgeMiddleware = `import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getClientId, formatRateLimitResponse, defaultLimits } from '@/lib/rate-limit/config';

// Note: This is a simplified version for edge runtime
// Redis is not available in edge runtime, so this uses in-memory limiting

const rateLimiters = new Map();

export async function rateLimitMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Skip rate limiting for static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Determine rate limit config based on path
  let config = defaultLimits.api;
  if (pathname.startsWith('/api/auth')) {
    config = defaultLimits.auth;
  } else if (pathname.startsWith('/api/upload')) {
    config = defaultLimits.upload;
  }

  const key = \`\${pathname}:\${config.points}:\${config.duration}\`;
  
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, createRateLimiter(pathname, config));
  }

  const rateLimiter = rateLimiters.get(key);
  const clientId = getClientId(req);

  try {
    const rateLimiterRes = await rateLimiter.consume(clientId);
    const response = NextResponse.next();
    
    const headers = formatRateLimitResponse(rateLimiterRes);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value.toString());
    });

    return response;
  } catch (rejRes: any) {
    const headers = formatRateLimitResponse(rejRes);
    
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rejRes.msBeforeNext / 1000,
      },
      {
        status: 429,
        headers: headers as any,
      }
    );
  }
}
`;

    writeFileSync(join(projectPath, 'middleware-ratelimit.ts'), edgeMiddleware);

    // Create example rate-limited API routes
    const exampleDir = join(projectPath, 'app', 'api', 'rate-limited');
    if (!existsSync(exampleDir)) {
      mkdirSync(exampleDir, { recursive: true });
    }

    const publicExample = `import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit/middleware';

export const GET = withRateLimit(async (req: NextRequest) => {
  return NextResponse.json({
    message: 'This endpoint is rate limited',
    limit: '100 requests per minute',
    timestamp: new Date().toISOString(),
  });
});
`;

    writeFileSync(join(exampleDir, 'public', 'route.ts'), publicExample);

    const authExample = `import { NextRequest, NextResponse } from 'next/server';
import { withAuthRateLimit } from '@/lib/rate-limit/middleware';

export const POST = withAuthRateLimit(async (req: NextRequest) => {
  // Simulate authentication attempt
  const { username, password } = await req.json();
  
  // This endpoint is strictly rate limited to prevent brute force
  return NextResponse.json({
    message: 'Authentication endpoint with strict rate limiting',
    limit: '5 attempts per 15 minutes',
  });
});
`;

    const authDir = join(exampleDir, 'auth');
    if (!existsSync(authDir)) {
      mkdirSync(authDir, { recursive: true });
    }
    writeFileSync(join(authDir, 'route.ts'), authExample);
  }

  // Create rate limit testing page
  const testPageDir = join(projectPath, 'app', 'test-rate-limit');
  if (!existsSync(testPageDir)) {
    mkdirSync(testPageDir, { recursive: true });
  }

  const testPage = `'use client';

import { useState } from 'react';

export default function TestRateLimit() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      const headers: any = {};
      response.headers.forEach((value, key) => {
        if (key.startsWith('x-ratelimit')) {
          headers[key] = value;
        }
      });
      
      const data = await response.json();
      
      setResponses(prev => [{
        endpoint,
        status: response.status,
        headers,
        data,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const sendMultipleRequests = async (endpoint: string, count: number) => {
    for (let i = 0; i < count; i++) {
      await testEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Rate Limiting Test</h1>
      
      <div className="space-y-4 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Test Endpoints</h2>
          <div className="space-x-2">
            <button
              onClick={() => testEndpoint('/api/rate-limited/public')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Public API (100/min)
            </button>
            <button
              onClick={() => testEndpoint('/api/rate-limited/auth')}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test Auth API (5/15min)
            </button>
            <button
              onClick={() => sendMultipleRequests('/api/rate-limited/public', 10)}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Send 10 Requests
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Responses</h2>
        <div className="space-y-2">
          {responses.map((response, index) => (
            <div key={index} className="border rounded p-4 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{response.endpoint}</span>
                <span className="text-sm text-gray-500">{response.timestamp}</span>
              </div>
              <div className="text-sm">
                <p className={\`font-medium \${response.status === 429 ? 'text-red-600' : 'text-green-600'}\`}>
                  Status: {response.status}
                </p>
                {response.headers['x-ratelimit-limit'] && (
                  <p>Limit: {response.headers['x-ratelimit-limit']}</p>
                )}
                {response.headers['x-ratelimit-remaining'] && (
                  <p>Remaining: {response.headers['x-ratelimit-remaining']}</p>
                )}
                {response.data.retryAfter && (
                  <p className="text-red-600">Retry after: {response.data.retryAfter}s</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;

  writeFileSync(join(testPageDir, 'page.tsx'), testPage);
}

async function updateEnvVariables(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  const rateLimitEnvVars = `
# Rate Limiting Configuration
REDIS_URL= # Optional: Redis connection string for distributed rate limiting
RATE_LIMIT_ENABLED=true
`;

  if (!envContent.includes('REDIS_URL')) {
    envContent += rateLimitEnvVars;
    writeFileSync(envExamplePath, envContent);
  }
}