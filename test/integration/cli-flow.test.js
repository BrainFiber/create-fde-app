import { jest } from '@jest/globals';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI Integration Tests', () => {
  const cliPath = join(__dirname, '../../bin/create-fde-app.js');
  let tempDir;
  
  beforeEach(() => {
    // Create temporary directory for test projects
    tempDir = mkdtempSync(join(tmpdir(), 'create-fde-app-test-'));
  });
  
  afterEach(() => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should create a basic Next.js project', () => {
    const projectName = 'test-nextjs-integration';
    const projectPath = join(tempDir, projectName);
    
    // Run the CLI with minimal options
    const output = execSync(
      `node ${cliPath} ${projectName} --no-git --no-install`,
      {
        cwd: tempDir,
        encoding: 'utf8',
        env: {
          ...process.env,
          // Set non-interactive mode for testing
          CI: 'true',
          // Provide default answers
          CREATE_FDE_APP_FRAMEWORK: 'nextjs',
          CREATE_FDE_APP_DEPLOY_TARGET: 'vercel',
          CREATE_FDE_APP_FEATURES: 'docker',
          CREATE_FDE_APP_AUGMENTATIONS: ''
        }
      }
    );
    
    // Verify project was created
    expect(existsSync(projectPath)).toBe(true);
    
    // Verify essential files exist
    expect(existsSync(join(projectPath, 'package.json'))).toBe(true);
    expect(existsSync(join(projectPath, 'Dockerfile'))).toBe(true);
    expect(existsSync(join(projectPath, '.dockerignore'))).toBe(true);
    expect(existsSync(join(projectPath, 'vercel.json'))).toBe(true);
    
    // Verify output contains success messages
    expect(output).toContain('successfully');
  }, 60000); // 60 second timeout for project creation

  test('should handle invalid project names', () => {
    const invalidNames = [
      '../invalid-path',
      '/absolute/path',
      'project with spaces',
      'project!with@special#chars'
    ];
    
    for (const invalidName of invalidNames) {
      let error;
      
      try {
        execSync(
          `node ${cliPath} "${invalidName}" --no-git --no-install`,
          {
            cwd: tempDir,
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, CI: 'true' }
          }
        );
      } catch (e) {
        error = e;
      }
      
      expect(error).toBeDefined();
    }
  });

  test('should create project with augmentations', () => {
    const projectName = 'test-augmentations-integration';
    const projectPath = join(tempDir, projectName);
    
    // Run the CLI with augmentations
    execSync(
      `node ${cliPath} ${projectName} --no-git --no-install`,
      {
        cwd: tempDir,
        encoding: 'utf8',
        env: {
          ...process.env,
          CI: 'true',
          CREATE_FDE_APP_FRAMEWORK: 'nextjs',
          CREATE_FDE_APP_DEPLOY_TARGET: 'aws-apprunner',
          CREATE_FDE_APP_FEATURES: 'docker,github-actions',
          CREATE_FDE_APP_AUGMENTATIONS: 'database:postgres,auth:nextauth'
        }
      }
    );
    
    // Verify augmentations were applied
    expect(existsSync(join(projectPath, 'prisma/schema.prisma'))).toBe(true);
    expect(existsSync(join(projectPath, 'lib/db.js'))).toBe(true);
    expect(existsSync(join(projectPath, 'app/api/auth/[...nextauth]/route.js'))).toBe(true);
    expect(existsSync(join(projectPath, '.github/workflows/deploy.yml'))).toBe(true);
  }, 60000);

  test('should respect --no-git flag', () => {
    const projectName = 'test-no-git';
    const projectPath = join(tempDir, projectName);
    
    execSync(
      `node ${cliPath} ${projectName} --no-git --no-install`,
      {
        cwd: tempDir,
        encoding: 'utf8',
        env: {
          ...process.env,
          CI: 'true',
          CREATE_FDE_APP_FRAMEWORK: 'nextjs',
          CREATE_FDE_APP_DEPLOY_TARGET: 'vercel',
          CREATE_FDE_APP_FEATURES: '',
          CREATE_FDE_APP_AUGMENTATIONS: ''
        }
      }
    );
    
    // Verify git was not initialized
    expect(existsSync(join(projectPath, '.git'))).toBe(false);
  });

  test('should handle different frameworks', () => {
    const frameworks = ['nextjs', 'nuxtjs', 'remix'];
    
    for (const framework of frameworks) {
      const projectName = `test-${framework}-project`;
      const projectPath = join(tempDir, projectName);
      
      execSync(
        `node ${cliPath} ${projectName} --no-git --no-install`,
        {
          cwd: tempDir,
          encoding: 'utf8',
          env: {
            ...process.env,
            CI: 'true',
            CREATE_FDE_APP_FRAMEWORK: framework,
            CREATE_FDE_APP_DEPLOY_TARGET: 'vercel',
            CREATE_FDE_APP_FEATURES: 'docker',
            CREATE_FDE_APP_AUGMENTATIONS: ''
          }
        }
      );
      
      // Verify project was created
      expect(existsSync(projectPath)).toBe(true);
      expect(existsSync(join(projectPath, 'package.json'))).toBe(true);
      expect(existsSync(join(projectPath, 'Dockerfile'))).toBe(true);
    }
  }, 120000); // 2 minute timeout for multiple projects
});