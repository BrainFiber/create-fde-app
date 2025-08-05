import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupAuth0(projectPath, framework) {
  console.log(chalk.blue('\n🔐 Setting up Auth0\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install Auth0 SDK based on framework
    const packages = framework === 'nextjs' 
      ? '@auth0/nextjs-auth0'
      : '@auth0/auth0-react';
    
    execSync(`npm install ${packages}`, { 
      cwd: projectPath,
      stdio: 'pipe'
    });

    spinner.succeed('Dependencies installed');

    // Setup based on framework
    if (framework === 'nextjs') {
      await setupAuth0NextJS(projectPath);
    } else if (framework === 'nuxtjs') {
      await setupAuth0Nuxt(projectPath);
    } else if (framework === 'remix') {
      await setupAuth0Remix(projectPath);
    }

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    console.log(chalk.green('\n✅ Auth0 setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Create an Auth0 application at https://auth0.com');
    console.log('2. Update AUTH0_* variables in .env');
    console.log('3. Configure callback URLs in Auth0 dashboard:');
    console.log('   - Callback: http://localhost:3000/api/auth/callback');
    console.log('   - Logout: http://localhost:3000/');
    console.log('4. Test authentication at /api/auth/login\n');

  } catch (error) {
    spinner.fail('Auth0 setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function setupAuth0NextJS(projectPath) {
  const spinner = ora('Setting up Auth0 for Next.js...').start();

  // Create API routes
  const authApiDir = join(projectPath, 'app', 'api', 'auth', '[auth0]');
  if (!existsSync(authApiDir)) {
    mkdirSync(authApiDir, { recursive: true });
  }

  const authRoute = `import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',
  }),
  logout: handleLogout({
    returnTo: '/',
  }),
  callback: handleCallback({
    afterCallback: async (req, res, session) => {
      // Custom logic after successful login
      return session;
    },
  }),
});
`;

  writeFileSync(join(authApiDir, 'route.ts'), authRoute);

  // Create middleware
  const middleware = `import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired();

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
  ],
};
`;

  writeFileSync(join(projectPath, 'middleware.ts'), middleware);

  // Create auth utilities
  const authDir = join(projectPath, 'lib', 'auth');
  if (!existsSync(authDir)) {
    mkdirSync(authDir, { recursive: true });
  }

  const authUtils = `import { getSession, withApiAuthRequired, withPageAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export { withApiAuthRequired, withPageAuthRequired };

// Custom claims helper
export function getCustomClaim(session: any, claim: string) {
  return session?.user?.[claim] || session?.user?.[\\`https://myapp.com/\\${claim}\\`];
}
`;

  writeFileSync(join(authDir, 'auth0-utils.ts'), authUtils);

  // Create UserProvider component
  const providersDir = join(projectPath, 'app', 'providers');
  if (!existsSync(providersDir)) {
    mkdirSync(providersDir, { recursive: true });
  }

  const userProvider = `'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';

export function Auth0Provider({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
`;

  writeFileSync(join(providersDir, 'auth0.tsx'), userProvider);

  // Create example pages
  await createAuth0Pages(projectPath);

  spinner.succeed('Auth0 Next.js setup complete');
}

async function setupAuth0Nuxt(projectPath) {
  const spinner = ora('Setting up Auth0 for Nuxt.js...').start();

  // Install Nuxt Auth0 module
  execSync('npm install @auth0/auth0-vue', { 
    cwd: projectPath,
    stdio: 'pipe'
  });

  // Create auth plugin
  const pluginsDir = join(projectPath, 'plugins');
  if (!existsSync(pluginsDir)) {
    mkdirSync(pluginsDir, { recursive: true });
  }

  const authPlugin = `import { createAuth0 } from '@auth0/auth0-vue';

export default defineNuxtPlugin((nuxtApp) => {
  const auth0 = createAuth0({
    domain: process.env.AUTH0_DOMAIN || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    authorizationParams: {
      redirect_uri: window.location.origin,
    },
  });

  nuxtApp.vueApp.use(auth0);
});
`;

  writeFileSync(join(pluginsDir, 'auth0.client.ts'), authPlugin);

  // Create composables
  const composablesDir = join(projectPath, 'composables');
  if (!existsSync(composablesDir)) {
    mkdirSync(composablesDir, { recursive: true });
  }

  const useAuth = `import { useAuth0 } from '@auth0/auth0-vue';

export const useAuth = () => {
  const { 
    loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    isLoading,
    getAccessTokenSilently
  } = useAuth0();

  const login = async () => {
    await loginWithRedirect({
      appState: { returnTo: '/dashboard' }
    });
  };

  const logoutUser = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return {
    login,
    logout: logoutUser,
    user: computed(() => user.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    isLoading: computed(() => isLoading.value),
    getAccessTokenSilently,
  };
};
`;

  writeFileSync(join(composablesDir, 'useAuth.ts'), useAuth);

  spinner.succeed('Auth0 Nuxt.js setup complete');
}

async function setupAuth0Remix(projectPath) {
  const spinner = ora('Setting up Auth0 for Remix...').start();

  // Install Remix Auth0
  execSync('npm install remix-auth remix-auth-auth0', { 
    cwd: projectPath,
    stdio: 'pipe'
  });

  // Create auth server utilities
  const authDir = join(projectPath, 'app', 'services', 'auth.server.ts');
  if (!existsSync(join(projectPath, 'app', 'services'))) {
    mkdirSync(join(projectPath, 'app', 'services'), { recursive: true });
  }

  const authService = `import { Authenticator } from 'remix-auth';
import { Auth0Strategy } from 'remix-auth-auth0';
import { sessionStorage } from '~/services/session.server';

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export const authenticator = new Authenticator<User>(sessionStorage);

const auth0Strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN!,
    clientID: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/auth/callback',
  },
  async ({ profile }) => {
    return {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0]?.value,
    };
  }
);

authenticator.use(auth0Strategy);

export async function requireAuth(request: Request) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    throw await authenticator.logout(request, { redirectTo: '/login' });
  }
  return user;
}
`;

  writeFileSync(authDir, authService);

  // Create session storage
  const sessionService = `import { createCookieSessionStorage } from '@remix-run/node';

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '_session',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET || 'default-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
`;

  writeFileSync(join(projectPath, 'app', 'services', 'session.server.ts'), sessionService);

  spinner.succeed('Auth0 Remix setup complete');
}

async function updateEnvVariables(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  const auth0EnvVars = `
# Auth0 Configuration
AUTH0_SECRET='use-a-long-random-string'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='your-api-audience'
AUTH0_SCOPE='openid profile email'
`;

  if (!envContent.includes('AUTH0_SECRET')) {
    envContent += auth0EnvVars;
    writeFileSync(envExamplePath, envContent);
  }

  // Also update .env if it exists
  const envPath = join(projectPath, '.env');
  if (existsSync(envPath)) {
    let env = readFileSync(envPath, 'utf8');
    if (!env.includes('AUTH0_SECRET')) {
      env += auth0EnvVars;
      writeFileSync(envPath, env);
    }
  }
}

async function createAuth0Pages(projectPath) {
  // Create login page
  const loginDir = join(projectPath, 'app', 'login');
  if (!existsSync(loginDir)) {
    mkdirSync(loginDir, { recursive: true });
  }

  const loginPage = `'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Login() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="text-3xl font-bold">Welcome</h2>
        <p className="mt-2 text-gray-600">Please sign in to continue</p>
        <a
          href="/api/auth/login"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign In with Auth0
        </a>
      </div>
    </div>
  );
}
`;

  writeFileSync(join(loginDir, 'page.tsx'), loginPage);

  // Create dashboard page
  const dashboardDir = join(projectPath, 'app', 'dashboard');
  if (!existsSync(dashboardDir)) {
    mkdirSync(dashboardDir, { recursive: true });
  }

  const dashboardPage = `'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { redirect } from 'next/navigation';

export default function Dashboard() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-24 h-24 rounded-full mb-4"
          />
        )}
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <a
          href="/api/auth/logout"
          className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </a>
      </div>
    </div>
  );
}
`;

  writeFileSync(join(dashboardDir, 'page.tsx'), dashboardPage);
}