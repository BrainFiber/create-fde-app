import { jest } from '@jest/globals';
import { execa } from 'execa';
import { existsSync } from 'fs';
import chalk from 'chalk';

// Mock dependencies
jest.mock('execa');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn()
}));
jest.mock('chalk', () => ({
  default: {
    green: jest.fn(text => text),
    red: jest.fn(text => text),
    yellow: jest.fn(text => text),
    blue: jest.fn(text => text),
    gray: jest.fn(text => text),
    bold: jest.fn(text => text),
    dim: jest.fn(text => text)
  }
}));

describe('FrameworkWrapper', () => {
  let createFrameworkProject;
  let frameworks;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Dynamically import to get fresh module
    const module = await import('../../lib/framework-wrapper.js');
    createFrameworkProject = module.createFrameworkProject;
    
    const configModule = await import('../../config/frameworks.json', {
      assert: { type: 'json' }
    });
    frameworks = configModule.default;
  });

  test('should create Next.js project with correct command', async () => {
    const projectName = 'test-nextjs-app';
    const framework = 'nextjs';
    
    execa.mockResolvedValue({ stdout: 'Success', stderr: '' });
    existsSync.mockReturnValue(false);
    
    await createFrameworkProject(projectName, framework);
    
    expect(execa).toHaveBeenCalledWith(
      'npx',
      [
        'create-next-app@latest',
        projectName,
        '--typescript',
        '--tailwind',
        '--app',
        '--src-dir',
        '--no-git'
      ],
      expect.objectContaining({
        stdio: 'inherit'
      })
    );
  });

  test('should create Nuxt.js project with correct command', async () => {
    const projectName = 'test-nuxt-app';
    const framework = 'nuxtjs';
    
    execa.mockResolvedValue({ stdout: 'Success', stderr: '' });
    existsSync.mockReturnValue(false);
    
    await createFrameworkProject(projectName, framework);
    
    expect(execa).toHaveBeenCalledWith(
      'npx',
      [
        'nuxi@latest',
        'init',
        projectName,
        '--no-install',
        '--no-gitInit'
      ],
      expect.objectContaining({
        stdio: 'inherit'
      })
    );
  });

  test('should create Remix project with correct command', async () => {
    const projectName = 'test-remix-app';
    const framework = 'remix';
    
    execa.mockResolvedValue({ stdout: 'Success', stderr: '' });
    existsSync.mockReturnValue(false);
    
    await createFrameworkProject(projectName, framework);
    
    expect(execa).toHaveBeenCalledWith(
      'npx',
      [
        'create-remix@latest',
        projectName,
        '--yes',
        '--no-install',
        '--no-git-init'
      ],
      expect.objectContaining({
        stdio: 'inherit'
      })
    );
  });

  test('should throw error if project directory already exists', async () => {
    const projectName = 'existing-project';
    const framework = 'nextjs';
    
    existsSync.mockReturnValue(true);
    
    await expect(createFrameworkProject(projectName, framework))
      .rejects
      .toThrow(`Directory ${projectName} already exists`);
  });

  test('should throw error for unsupported framework', async () => {
    const projectName = 'test-app';
    const framework = 'unsupported-framework';
    
    existsSync.mockReturnValue(false);
    
    await expect(createFrameworkProject(projectName, framework))
      .rejects
      .toThrow(`Framework ${framework} is not supported`);
  });

  test('should handle command execution errors', async () => {
    const projectName = 'test-app';
    const framework = 'nextjs';
    const errorMessage = 'Command failed';
    
    existsSync.mockReturnValue(false);
    execa.mockRejectedValue(new Error(errorMessage));
    
    await expect(createFrameworkProject(projectName, framework))
      .rejects
      .toThrow(`Failed to create ${framework} project: ${errorMessage}`);
  });

  test('should validate all configured frameworks have required fields', () => {
    Object.entries(frameworks).forEach(([key, config]) => {
      expect(config).toHaveProperty('displayName');
      expect(config).toHaveProperty('createCommand');
      expect(config).toHaveProperty('runtime');
      expect(config).toHaveProperty('port');
      
      // Validate runtime is valid
      expect(['node', 'python']).toContain(config.runtime);
      
      // Validate port is a number
      expect(typeof config.port).toBe('number');
    });
  });
});