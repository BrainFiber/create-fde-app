import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function setupMongoDB(projectPath, framework) {
  console.log(chalk.blue('\n🍃 Setting up MongoDB with Prisma\n'));

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

    console.log(chalk.green('\n✅ MongoDB setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Update your DATABASE_URL in .env');
    console.log('2. Run `npm run db:generate` to generate Prisma client');
    console.log('3. MongoDB doesn\'t require migrations - use `npm run db:push` to sync\n');

  } catch (error) {
    spinner.fail('MongoDB setup failed');
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

  // Create MongoDB-specific helper functions
  const dbHelpers = `import { prisma } from './prisma';

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
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
    return { error: 'Document not found.' };
  }
  return { error: 'An unexpected database error occurred.' };
}

// MongoDB-specific helpers
export function toObjectId(id: string) {
  return id; // Prisma handles ObjectId conversion
}

export async function createIndexes() {
  // Add custom indexes if needed
  // MongoDB creates indexes based on Prisma schema automatically
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
# Database (MongoDB)
DATABASE_URL="mongodb://localhost:27017/mydb?directConnection=true"
# For MongoDB Atlas:
# DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority"
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
  
  // Add Prisma scripts (MongoDB doesn't use migrations)
  packageJson.scripts['db:generate'] = 'prisma generate';
  packageJson.scripts['db:push'] = 'prisma db push';
  packageJson.scripts['db:studio'] = 'prisma studio';
  packageJson.scripts['db:seed'] = 'prisma db seed';

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// Reuse framework-specific setup with MongoDB adjustments
async function frameworkSpecificSetup(projectPath, framework) {
  // Most setup is identical, just different connection string
  const postgresSetup = await import('../postgres/setup.js');
  await postgresSetup.frameworkSpecificSetup(projectPath, framework);
}