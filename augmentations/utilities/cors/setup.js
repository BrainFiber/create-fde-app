import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupCORS(projectPath, framework) {
  console.log(chalk.blue('\n🔒 Setting up CORS Configuration\n'));

  const spinner = ora('Creating CORS configuration...').start();

  try {
    // Create CORS utilities
    await createCORSConfig(projectPath, framework);
    spinner.succeed('CORS configuration created');

    // Create middleware
    spinner.start('Creating CORS middleware...');
    await createCORSMiddleware(projectPath, framework);
    spinner.succeed('CORS middleware created');

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    console.log(chalk.green('\n✅ CORS setup complete!\n'));
    console.log(chalk.yellow('Features:'));
    console.log('  - Configurable allowed origins');
    console.log('  - Support for credentials');
    console.log('  - Preflight request handling');
    console.log('  - Custom headers configuration\n');

  } catch (error) {
    spinner.fail('CORS setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function createCORSConfig(projectPath, framework) {
  const libDir = join(projectPath, 'lib', 'cors');
  if (!existsSync(libDir)) {
    mkdirSync(libDir, { recursive: true });
  }

  const corsConfig = `export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

// Default CORS configuration
export const defaultCORSConfig: CORSConfig = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-CSRF-Token',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Validate origin against allowed origins
export function isOriginAllowed(origin: string | undefined, config: CORSConfig): boolean {
  if (!origin) return false;
  
  // Check exact matches
  if (config.allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check wildcard patterns
  for (const allowed of config.allowedOrigins) {
    if (allowed === '*') return true;
    
    // Support wildcard subdomains like *.example.com
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      const regex = new RegExp(\`^https?://[^/]+\\\\\.\${domain.replace('.', '\\\\.')}$\`);
      if (regex.test(origin)) return true;
    }
  }
  
  return false;
}

// Get CORS headers
export function getCORSHeaders(origin: string | undefined, config: CORSConfig = defaultCORSConfig) {
  const headers: Record<string, string> = {};
  
  // Handle origin
  if (origin && isOriginAllowed(origin, config)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (config.allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  // Only set other headers if origin is allowed
  if (headers['Access-Control-Allow-Origin']) {
    headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
    headers['Access-Control-Max-Age'] = config.maxAge.toString();
    
    if (config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }
  
  return headers;
}

// Environment-specific configurations
export function getEnvironmentConfig(): Partial<CORSConfig> {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
        credentials: true,
      };
    
    case 'development':
      return {
        allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
        credentials: true,
      };
    
    default:
      return {};
  }
}

// Merge configurations
export function createCORSConfig(overrides?: Partial<CORSConfig>): CORSConfig {
  return {
    ...defaultCORSConfig,
    ...getEnvironmentConfig(),
    ...overrides,
  };
}
`;

  writeFileSync(join(libDir, 'config.ts'), corsConfig);
}

async function createCORSMiddleware(projectPath, framework) {
  const corsDir = join(projectPath, 'lib', 'cors');

  if (framework === 'nextjs') {
    // Create Next.js CORS middleware
    const corsMiddleware = `import { NextRequest, NextResponse } from 'next/server';
import { getCORSHeaders, createCORSConfig, CORSConfig } from './config';

export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<CORSConfig>
) {
  const corsConfig = createCORSConfig(config);

  return async (req: NextRequest) => {
    const origin = req.headers.get('origin');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const headers = getCORSHeaders(origin || undefined, corsConfig);
      return new NextResponse(null, {
        status: 200,
        headers,
      });
    }

    // Handle actual requests
    const response = await handler(req);
    const headers = getCORSHeaders(origin || undefined, corsConfig);

    // Apply CORS headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

// Middleware for public APIs (allow all origins)
export const withPublicCORS = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withCORS(handler, { allowedOrigins: ['*'], credentials: false });

// Middleware for authenticated APIs (strict CORS)
export const withAuthCORS = (handler: (req: NextRequest) => Promise<NextResponse>) =>
  withCORS(handler, { credentials: true });

// Global CORS middleware
export function corsMiddleware(req: NextRequest) {
  const corsConfig = createCORSConfig();
  const origin = req.headers.get('origin');
  const headers = getCORSHeaders(origin || undefined, corsConfig);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers,
    });
  }

  // For other requests, add headers to the response
  const response = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
`;

    writeFileSync(join(corsDir, 'middleware.ts'), corsMiddleware);

    // Create Next.js config helper
    const nextConfigHelper = `// Helper for next.config.js
export const corsHeaders = [
  {
    key: 'Access-Control-Allow-Credentials',
    value: 'true',
  },
  {
    key: 'Access-Control-Allow-Origin',
    value: process.env.ALLOWED_ORIGINS || '*',
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  },
];

// Add to next.config.js:
// async headers() {
//   return [
//     {
//       source: '/api/:path*',
//       headers: corsHeaders,
//     },
//   ];
// }
`;

    writeFileSync(join(corsDir, 'next-config.ts'), nextConfigHelper);

    // Create example CORS-enabled API routes
    const exampleDir = join(projectPath, 'app', 'api', 'cors-example');
    if (!existsSync(exampleDir)) {
      mkdirSync(exampleDir, { recursive: true });
    }

    const publicApi = `import { NextRequest, NextResponse } from 'next/server';
import { withPublicCORS } from '@/lib/cors/middleware';

export const GET = withPublicCORS(async (req: NextRequest) => {
  return NextResponse.json({
    message: 'This is a public API with CORS enabled for all origins',
    timestamp: new Date().toISOString(),
  });
});

export const OPTIONS = withPublicCORS(async (req: NextRequest) => {
  return new NextResponse(null, { status: 200 });
});
`;

    writeFileSync(join(exampleDir, 'public', 'route.ts'), publicApi);

    const protectedApi = `import { NextRequest, NextResponse } from 'next/server';
import { withAuthCORS } from '@/lib/cors/middleware';

export const GET = withAuthCORS(async (req: NextRequest) => {
  // Check for authentication token
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: 'This is a protected API with strict CORS',
    user: 'authenticated-user',
    timestamp: new Date().toISOString(),
  });
});

export const OPTIONS = withAuthCORS(async (req: NextRequest) => {
  return new NextResponse(null, { status: 200 });
});
`;

    const protectedDir = join(exampleDir, 'protected');
    if (!existsSync(protectedDir)) {
      mkdirSync(protectedDir, { recursive: true });
    }
    writeFileSync(join(protectedDir, 'route.ts'), protectedApi);
  }

  // Create CORS testing page
  const testPageDir = join(projectPath, 'app', 'test-cors');
  if (!existsSync(testPageDir)) {
    mkdirSync(testPageDir, { recursive: true });
  }

  const testPage = `'use client';

import { useState } from 'react';

export default function TestCORS() {
  const [results, setResults] = useState<any[]>([]);

  const testCORS = async (endpoint: string, includeAuth: boolean = false) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (includeAuth) {
        headers['Authorization'] = 'Bearer test-token';
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        credentials: includeAuth ? 'include' : 'omit',
      });

      const data = await response.json();
      
      setResults(prev => [{
        endpoint,
        status: response.status,
        data,
        timestamp: new Date().toLocaleTimeString(),
        corsHeaders: {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        }
      }, ...prev]);
    } catch (error: any) {
      setResults(prev => [{
        endpoint,
        error: error.message,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev]);
    }
  };

  const testFromDifferentOrigin = async () => {
    // This simulates a request from a different origin
    const testOrigin = 'https://example.com';
    alert(\`To properly test CORS, open the browser console and run:
    
fetch('\${window.location.origin}/api/cors-example/public', {
  headers: { 'Origin': '\${testOrigin}' }
}).then(r => r.json()).then(console.log)\`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CORS Testing</h1>
      
      <div className="space-y-4 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Test Endpoints</h2>
          <div className="space-y-2">
            <button
              onClick={() => testCORS('/api/cors-example/public')}
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Public API (Allow All Origins)
            </button>
            <button
              onClick={() => testCORS('/api/cors-example/protected', true)}
              className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Protected API (With Credentials)
            </button>
            <button
              onClick={testFromDifferentOrigin}
              className="block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Simulate Cross-Origin Request
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Results</h2>
        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="border rounded p-4 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{result.endpoint}</span>
                <span className="text-sm text-gray-500">{result.timestamp}</span>
              </div>
              <div className="text-sm">
                {result.error ? (
                  <p className="text-red-600">Error: {result.error}</p>
                ) : (
                  <>
                    <p className="text-green-600">Status: {result.status}</p>
                    <p>Allow-Origin: {result.corsHeaders['Access-Control-Allow-Origin'] || 'Not set'}</p>
                    <p>Allow-Credentials: {result.corsHeaders['Access-Control-Allow-Credentials'] || 'Not set'}</p>
                    <p className="mt-2 text-gray-600">Response: {JSON.stringify(result.data)}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">CORS Testing Tips:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>CORS headers are only sent for cross-origin requests</li>
          <li>Same-origin requests won't show CORS headers</li>
          <li>Use browser DevTools Network tab to inspect headers</li>
          <li>Test from different domains to see CORS in action</li>
        </ul>
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

  const corsEnvVars = `
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001 # Comma-separated list
`;

  if (!envContent.includes('ALLOWED_ORIGINS')) {
    envContent += corsEnvVars;
    writeFileSync(envExamplePath, envContent);
  }
}