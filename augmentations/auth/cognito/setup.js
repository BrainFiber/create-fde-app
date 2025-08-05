import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupCognito(projectPath, framework) {
  console.log(chalk.blue('\n🔐 Setting up AWS Cognito\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install AWS Amplify
    execSync('yarn add aws-amplify @aws-amplify/ui-react', { 
      cwd: projectPath,
      stdio: 'pipe'
    });

    spinner.succeed('Dependencies installed');

    // Create Cognito configuration
    spinner.start('Creating Cognito configuration...');
    await createCognitoConfig(projectPath);
    spinner.succeed('Cognito configuration created');

    // Create auth utilities
    spinner.start('Creating auth utilities...');
    await createAuthUtils(projectPath, framework);
    spinner.succeed('Auth utilities created');

    // Framework-specific setup
    if (framework === 'nextjs') {
      await setupCognitoNextJS(projectPath);
    } else if (framework === 'nuxtjs') {
      await setupCognitoNuxt(projectPath);
    } else if (framework === 'remix') {
      await setupCognitoRemix(projectPath);
    }

    // Update environment variables
    spinner.start('Updating environment variables...');
    await updateEnvVariables(projectPath);
    spinner.succeed('Environment variables updated');

    // Create Terraform configuration for Cognito
    spinner.start('Creating Terraform configuration...');
    await createCognitoTerraform(projectPath);
    spinner.succeed('Terraform configuration created');

    console.log(chalk.green('\n✅ AWS Cognito setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Update AWS Cognito configuration in .env');
    console.log('2. Run terraform to create Cognito User Pool (optional)');
    console.log('3. Configure app client settings in AWS Console');
    console.log('4. Test authentication at /auth/signin\n');

  } catch (error) {
    spinner.fail('AWS Cognito setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function createCognitoConfig(projectPath) {
  const configDir = join(projectPath, 'lib', 'config');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const amplifyConfig = `export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
          scopes: ['phone', 'email', 'profile', 'openid'],
          redirectSignIn: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || 'http://localhost:3000/'],
          redirectSignOut: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || 'http://localhost:3000/'],
          responseType: 'code',
        },
        username: true,
        email: true,
      },
      signUpVerificationMethod: 'code',
      mfa: {
        status: 'off',
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    },
  },
};
`;

  writeFileSync(join(configDir, 'amplify.ts'), amplifyConfig);
}

async function createAuthUtils(projectPath, framework) {
  const authDir = join(projectPath, 'lib', 'auth');
  if (!existsSync(authDir)) {
    mkdirSync(authDir, { recursive: true });
  }

  const cognitoUtils = `import { Amplify } from 'aws-amplify';
import { 
  signIn, 
  signOut, 
  signUp, 
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  type SignInInput,
  type SignUpInput,
} from 'aws-amplify/auth';
import { amplifyConfig } from '@/lib/config/amplify';

// Configure Amplify
Amplify.configure(amplifyConfig);

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  attributes?: Record<string, string>;
}

export async function signUpUser({ username, password, email }: SignUpInput) {
  try {
    const { userId, isSignUpComplete, nextStep } = await signUp({
      username,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });
    
    return { userId, isSignUpComplete, nextStep };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

export async function confirmSignUpUser(username: string, code: string) {
  try {
    const { isSignUpComplete } = await confirmSignUp({ username, confirmationCode: code });
    return isSignUpComplete;
  } catch (error) {
    console.error('Error confirming sign up:', error);
    throw error;
  }
}

export async function signInUser({ username, password }: SignInInput) {
  try {
    const { isSignedIn, nextStep } = await signIn({ username, password });
    return { isSignedIn, nextStep };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    
    return {
      id: user.userId,
      username: user.username,
      email: session.tokens?.idToken?.payload?.email as string || '',
      attributes: session.tokens?.idToken?.payload as Record<string, string>,
    };
  } catch {
    return null;
  }
}

export async function resetUserPassword(username: string) {
  try {
    const output = await resetPassword({ username });
    return output;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

export async function confirmPasswordReset(
  username: string,
  confirmationCode: string,
  newPassword: string
) {
  try {
    await confirmResetPassword({ username, confirmationCode, newPassword });
  } catch (error) {
    console.error('Error confirming password reset:', error);
    throw error;
  }
}

export async function getAccessToken() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString();
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
`;

  writeFileSync(join(authDir, 'cognito-utils.ts'), cognitoUtils);

  // Create auth context/hooks
  const authHooks = `'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Hub } from 'aws-amplify/utils';
import { getAuthUser, signOutUser, type AuthUser } from './cognito-utils';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const authUser = await getAuthUser();
      setUser(authUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const unsubscribe = Hub.listen('auth', ({ payload: { event } }) => {
      switch (event) {
        case 'signIn':
        case 'signUp':
          checkAuth();
          break;
        case 'signOut':
          setUser(null);
          break;
      }
    });

    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
`;

  writeFileSync(join(authDir, 'auth-context.tsx'), authHooks);
}

async function setupCognitoNextJS(projectPath) {
  const spinner = ora('Setting up Cognito for Next.js...').start();

  // Create sign-in page
  const signinDir = join(projectPath, 'app', 'auth', 'signin');
  if (!existsSync(signinDir)) {
    mkdirSync(signinDir, { recursive: true });
  }

  const signinPage = `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInUser, signUpUser, confirmSignUpUser } from '@/lib/auth/cognito-utils';

export default function SignIn() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmationCode: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { isSignedIn } = await signInUser({
        username: formData.username,
        password: formData.password,
      });
      
      if (isSignedIn) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { nextStep } = await signUpUser({
        username: formData.username,
        password: formData.password,
        email: formData.email,
      });
      
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setMode('confirm');
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await confirmSignUpUser(formData.username, formData.confirmationCode);
      setMode('signin');
      setError('Account confirmed! Please sign in.');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create a new account'}
            {mode === 'confirm' && 'Confirm your account'}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {mode === 'signin' && (
          <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign in
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-4">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (8+ chars, mixed case, number, symbol)"
              />
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign up
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {mode === 'confirm' && (
          <form className="mt-8 space-y-6" onSubmit={handleConfirm}>
            <div>
              <input
                type="text"
                value={formData.confirmationCode}
                onChange={(e) => setFormData({ ...formData, confirmationCode: e.target.value })}
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmation code"
              />
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Confirm account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
`;

  writeFileSync(join(signinDir, 'page.tsx'), signinPage);

  // Create dashboard page
  const dashboardDir = join(projectPath, 'app', 'dashboard');
  if (!existsSync(dashboardDir)) {
    mkdirSync(dashboardDir, { recursive: true });
  }

  const dashboardPage = `'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <button
          onClick={signOut}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
`;

  writeFileSync(join(dashboardDir, 'page.tsx'), dashboardPage);

  spinner.succeed('Cognito Next.js setup complete');
}

async function setupCognitoNuxt(projectPath) {
  // Similar setup for Nuxt.js
  console.log(chalk.yellow('Nuxt.js Cognito setup - manual configuration required'));
}

async function setupCognitoRemix(projectPath) {
  // Similar setup for Remix
  console.log(chalk.yellow('Remix Cognito setup - manual configuration required'));
}

async function updateEnvVariables(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  const cognitoEnvVars = `
# AWS Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=
NEXT_PUBLIC_COGNITO_DOMAIN=
NEXT_PUBLIC_REDIRECT_SIGN_IN=http://localhost:3000/
NEXT_PUBLIC_REDIRECT_SIGN_OUT=http://localhost:3000/

# AWS Region
NEXT_PUBLIC_AWS_REGION=us-east-1
`;

  if (!envContent.includes('COGNITO_USER_POOL_ID')) {
    envContent += cognitoEnvVars;
    writeFileSync(envExamplePath, envContent);
  }
}

async function createCognitoTerraform(projectPath) {
  const terraformDir = join(projectPath, 'terraform', 'cognito');
  if (!existsSync(terraformDir)) {
    mkdirSync(terraformDir, { recursive: true });
  }

  const cognitoTf = `resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  auto_verified_attributes = ["email"]
  
  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }
}

resource "aws_cognito_user_pool_client" "app" {
  name         = var.app_client_name
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  allowed_oauth_flows = ["code"]
  allowed_oauth_scopes = ["phone", "email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  supported_identity_providers = ["COGNITO"]

  generate_secret = false
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain
  user_pool_id = aws_cognito_user_pool.main.id
}

output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "client_id" {
  value = aws_cognito_user_pool_client.app.id
}

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.main.domain
}
`;

  writeFileSync(join(terraformDir, 'cognito.tf'), cognitoTf);

  const variables = `variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
  default     = "my-app-users"
}

variable "app_client_name" {
  description = "Name of the app client"
  type        = string
  default     = "my-app-client"
}

variable "cognito_domain" {
  description = "Cognito domain prefix"
  type        = string
}

variable "callback_urls" {
  description = "List of allowed callback URLs"
  type        = list(string)
  default     = ["http://localhost:3000/"]
}

variable "logout_urls" {
  description = "List of allowed logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000/"]
}
`;

  writeFileSync(join(terraformDir, 'variables.tf'), variables);
}