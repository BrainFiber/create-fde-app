import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupPostgres(projectPath, framework) {
  console.log(chalk.blue('\n🐘 Setting up PostgreSQL with Prisma\n'));

  const spinner = ora('Installing dependencies...').start();

  try {
    // Install Prisma dependencies
    execSync('npm install --save-dev prisma', { 
      cwd: projectPath,
      stdio: 'pipe'
    });
    
    execSync('npm install @prisma/client', { 
      cwd: projectPath,
      stdio: 'pipe'
    });

    spinner.succeed('Dependencies installed');

    // Copy Prisma schema
    spinner.start('Setting up Prisma schema...');
    const schemaPath = join(projectPath, 'prisma', 'schema.prisma');
    const schemaDir = join(projectPath, 'prisma');
    
    if (!existsSync(schemaDir)) {
      execSync(`mkdir -p ${schemaDir}`, { cwd: projectPath });
    }

    const schemaTemplate = readFileSync(
      join(__dirname, 'schema.prisma'),
      'utf8'
    );
    writeFileSync(schemaPath, schemaTemplate);
    spinner.succeed('Prisma schema created');

    // Add database utilities
    spinner.start('Creating database utilities...');
    await createDatabaseUtils(projectPath, framework);
    spinner.succeed('Database utilities created');

    // Update .env.example
    spinner.start('Updating environment variables...');
    await updateEnvExample(projectPath);
    spinner.succeed('Environment variables updated');

    // Add package.json scripts
    spinner.start('Adding database scripts...');
    await addDatabaseScripts(projectPath);
    spinner.succeed('Database scripts added');

    // Framework-specific setup
    await frameworkSpecificSetup(projectPath, framework);

    console.log(chalk.green('\n✅ PostgreSQL setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Update your DATABASE_URL in .env');
    console.log('2. Run `npm run db:migrate` to create your database');
    console.log('3. Run `npm run db:generate` to generate Prisma client\n');

  } catch (error) {
    spinner.fail('PostgreSQL setup failed');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function createDatabaseUtils(projectPath, framework) {
  const utilsDir = join(projectPath, 'lib', 'db');
  execSync(`mkdir -p ${utilsDir}`, { cwd: projectPath });

  // Create Prisma client singleton
  const prismaClient = `import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`;

  writeFileSync(join(utilsDir, 'prisma.ts'), prismaClient);

  // Create database helper functions
  const dbHelpers = `import { prisma } from './prisma';

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Helper function to handle database errors
export function handleDatabaseError(error: any) {
  if (error.code === 'P2002') {
    return { error: 'A unique constraint would be violated.' };
  }
  if (error.code === 'P2025') {
    return { error: 'Record not found.' };
  }
  return { error: 'An unexpected database error occurred.' };
}
`;

  writeFileSync(join(utilsDir, 'helpers.ts'), dbHelpers);
}

async function updateEnvExample(projectPath) {
  const envExamplePath = join(projectPath, '.env.example');
  let envContent = '';

  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf8');
  }

  if (!envContent.includes('DATABASE_URL')) {
    envContent += `
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
`;
    writeFileSync(envExamplePath, envContent);
  }

  // Also create .env if it doesn't exist
  const envPath = join(projectPath, '.env');
  if (!existsSync(envPath)) {
    writeFileSync(envPath, envContent);
  }
}

async function addDatabaseScripts(projectPath) {
  const packageJsonPath = join(projectPath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  packageJson.scripts = packageJson.scripts || {};
  
  // Add Prisma scripts
  packageJson.scripts['db:generate'] = 'prisma generate';
  packageJson.scripts['db:migrate'] = 'prisma migrate dev';
  packageJson.scripts['db:push'] = 'prisma db push';
  packageJson.scripts['db:studio'] = 'prisma studio';
  packageJson.scripts['db:seed'] = 'prisma db seed';

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function frameworkSpecificSetup(projectPath, framework) {
  switch (framework) {
    case 'nextjs':
      await setupNextjsDatabase(projectPath);
      break;
    case 'nuxtjs':
      await setupNuxtjsDatabase(projectPath);
      break;
    case 'remix':
      await setupRemixDatabase(projectPath);
      break;
  }
}

async function setupNextjsDatabase(projectPath) {
  // Create API route for database health check
  const apiDir = join(projectPath, 'app', 'api', 'db-health');
  execSync(`mkdir -p ${apiDir}`, { cwd: projectPath });

  const healthRoute = `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    return NextResponse.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected' },
      { status: 503 }
    );
  }
}
`;

  writeFileSync(join(apiDir, 'route.ts'), healthRoute);
}

async function setupNuxtjsDatabase(projectPath) {
  // Create server plugin for database connection
  const serverDir = join(projectPath, 'server', 'plugins');
  execSync(`mkdir -p ${serverDir}`, { cwd: projectPath });

  const dbPlugin = `import { connectDatabase } from '~/lib/db/helpers';

export default defineNitroPlugin(async (nitroApp) => {
  await connectDatabase();
  console.log('Database connected in Nitro');
});
`;

  writeFileSync(join(serverDir, 'database.ts'), dbPlugin);
}

async function setupRemixDatabase(projectPath) {
  // Update entry.server to initialize database
  const entryServerPath = join(projectPath, 'app', 'entry.server.tsx');
  
  if (existsSync(entryServerPath)) {
    let content = readFileSync(entryServerPath, 'utf8');
    
    // Add import at the top
    content = `import { connectDatabase } from '~/lib/db/helpers';\n${content}`;
    
    // Add database connection
    content = content.replace(
      'export default function handleRequest(',
      `// Initialize database connection
connectDatabase().catch(console.error);

export default function handleRequest(`
    );
    
    writeFileSync(entryServerPath, content);
  }
}