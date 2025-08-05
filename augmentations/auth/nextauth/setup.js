import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupNextAuth(projectPath, framework) {
  if (framework !== 'nextjs') {
    console.log(chalk.yellow('\n⚠️  NextAuth.js is designed for Next.js applications\n'));
    return false;
  }

  console.log(chalk.blue('\n🔐 Setting up NextAuth.js\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install NextAuth dependencies
    execSync('yarn add next-auth', { 
      cwd: projectPath,
      stdio: 'pipe'
    });
    
    // Install adapters if using database
    if (existsSync(join(projectPath, 'prisma'))) {
      execSync('yarn add @auth/prisma-adapter', { 
        cwd: projectPath,
        stdio: 'pipe'
      });
    }

    spinner.succeed('Dependencies installed');

    // Create auth configuration
    spinner.start('Creating auth configuration...');
    await createAuthConfig(projectPath);
    spinner.succeed('Auth configuration created');

    // Create auth API routes
    spinner.start('Creating auth API routes...');
    await createAuthRoutes(projectPath);
    spinner.succeed('Auth API routes created');

    // Create auth utilities
    spinner.start('Creating auth utilities...');
    await createAuthUtils(projectPath);
    spinner.succeed('Auth utilities created');

    // Create middleware
    spinner.start('Creating middleware...');
    await createMiddleware(projectPath);
    spinner.succeed('Middleware created');

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    // Create example protected pages
    spinner.start('Creating example pages...');
    await createExamplePages(projectPath);
    spinner.succeed('Example pages created');

    console.log(chalk.green('\n✅ NextAuth.js setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Update NEXTAUTH_SECRET in .env (run: openssl rand -base64 32)');
    console.log('2. Configure OAuth providers in app/api/auth/[...nextauth]/options.ts');
    console.log('3. Wrap your app with SessionProvider');
    console.log('4. Visit /auth/signin to test authentication\n');

  } catch (error) {
    spinner.fail('NextAuth.js setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function createAuthConfig(projectPath) {
  const authDir = join(projectPath, 'lib', 'auth');
  if (!existsSync(authDir)) {
    mkdirSync(authDir, { recursive: true });
  }

  // Check if using Prisma
  const hasPrisma = existsSync(join(projectPath, 'prisma'));

  const authOptions = `import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
${hasPrisma ? "import { PrismaAdapter } from '@auth/prisma-adapter';\nimport { prisma } from '@/lib/db/prisma';" : ''}

export const authOptions: NextAuthOptions = {
  ${hasPrisma ? 'adapter: PrismaAdapter(prisma),' : ''}
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Add your own authentication logic here
        // Return user object if valid, null if invalid
        if (credentials?.email === 'user@example.com' && credentials?.password === 'password') {
          return {
            id: '1',
            name: 'Demo User',
            email: 'user@example.com',
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
`;

  writeFileSync(join(authDir, 'options.ts'), authOptions);

  // Create auth types
  const authTypes = `import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
`;

  writeFileSync(join(authDir, 'types.ts'), authTypes);
}

async function createAuthRoutes(projectPath) {
  const authApiDir = join(projectPath, 'app', 'api', 'auth', '[...nextauth]');
  if (!existsSync(authApiDir)) {
    mkdirSync(authApiDir, { recursive: true });
  }

  const routeHandler = `import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
`;

  writeFileSync(join(authApiDir, 'route.ts'), routeHandler);
}

async function createAuthUtils(projectPath) {
  const authDir = join(projectPath, 'lib', 'auth');

  const authUtils = `import { getServerSession } from 'next-auth/next';
import { authOptions } from './options';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }
  return user;
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
`;

  writeFileSync(join(authDir, 'utils.ts'), authUtils);

  // Create client-side hooks
  const clientHooks = `'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = false) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [requireAuth, status, router]);

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
`;

  writeFileSync(join(authDir, 'hooks.ts'), clientHooks);
}

async function createMiddleware(projectPath) {
  const middleware = `import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add custom middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'admin';
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/protected/:path*',
  ],
};
`;

  writeFileSync(join(projectPath, 'middleware.ts'), middleware);
}

async function updateEnvVariables(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  const authEnvVars = `
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# OAuth Providers
GITHUB_ID=
GITHUB_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
`;

  if (!envContent.includes('NEXTAUTH_URL')) {
    envContent += authEnvVars;
    writeFileSync(envExamplePath, envContent);
  }

  // Also update .env if it exists
  const envPath = join(projectPath, '.env');
  if (existsSync(envPath)) {
    let env = readFileSync(envPath, 'utf8');
    if (!env.includes('NEXTAUTH_URL')) {
      env += authEnvVars;
      writeFileSync(envPath, env);
    }
  }
}

async function createExamplePages(projectPath) {
  // Create sign-in page
  const signinDir = join(projectPath, 'app', 'auth', 'signin');
  if (!existsSync(signinDir)) {
    mkdirSync(signinDir, { recursive: true });
  }

  const signinPage = `'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', {
      email,
      password,
      callbackUrl,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>

          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => signIn('github', { callbackUrl })}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign in with GitHub
            </button>
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign in with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

  writeFileSync(join(signinDir, 'page.tsx'), signinPage);

  // Create protected dashboard page
  const dashboardDir = join(projectPath, 'app', 'dashboard');
  if (!existsSync(dashboardDir)) {
    mkdirSync(dashboardDir, { recursive: true });
  }

  const dashboardPage = `import { requireAuth } from '@/lib/auth/utils';
import { signOut } from 'next-auth/react';

export default async function Dashboard() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome, {user.name || user.email}!</p>
      <form
        action={async () => {
          'use server';
          await signOut();
        }}
      >
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
`;

  writeFileSync(join(dashboardDir, 'page.tsx'), dashboardPage);

  // Create SessionProvider component
  const providersDir = join(projectPath, 'app', 'providers');
  if (!existsSync(providersDir)) {
    mkdirSync(providersDir, { recursive: true });
  }

  const sessionProvider = `'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
`;

  writeFileSync(join(providersDir, 'index.tsx'), sessionProvider);
}