import { jest } from '@jest/globals';

describe('Prompts', () => {
  let promptQuestions;
  
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  test('should export promptQuestions function', async () => {
    const module = await import('../../lib/prompts.js');
    promptQuestions = module.promptQuestions;
    
    expect(typeof promptQuestions).toBe('function');
  });

  test('should handle CI environment', async () => {
    // Set CI environment variables
    process.env.CI = 'true';
    process.env.CREATE_FDE_APP_FRAMEWORK = 'nextjs';
    process.env.CREATE_FDE_APP_DEPLOY_TARGET = 'vercel';
    process.env.CREATE_FDE_APP_FEATURES = 'docker';
    process.env.CREATE_FDE_APP_AUGMENTATIONS = '';
    
    const module = await import('../../lib/prompts.js');
    const result = await module.promptQuestions();
    
    expect(result.framework).toBe('nextjs');
    expect(result.deployTarget).toBe('vercel');
    expect(result.features).toContain('docker');
    expect(result.initGit).toBe(false); // CI mode sets git to false
    expect(result.installDeps).toBe(false); // CI mode sets install to false
    
    // Clean up
    delete process.env.CI;
    delete process.env.CREATE_FDE_APP_FRAMEWORK;
    delete process.env.CREATE_FDE_APP_DEPLOY_TARGET;
    delete process.env.CREATE_FDE_APP_FEATURES;
    delete process.env.CREATE_FDE_APP_AUGMENTATIONS;
  });

  test('should parse features from environment correctly', async () => {
    process.env.CI = 'true';
    process.env.CREATE_FDE_APP_FRAMEWORK = 'nextjs';
    process.env.CREATE_FDE_APP_DEPLOY_TARGET = 'aws-apprunner';
    process.env.CREATE_FDE_APP_FEATURES = 'docker,github-actions,terraform';
    process.env.CREATE_FDE_APP_AUGMENTATIONS = 'database:postgres,auth:nextauth';
    
    const module = await import('../../lib/prompts.js');
    const result = await module.promptQuestions();
    
    expect(result.features).toContain('docker');
    expect(result.features).toContain('github-actions');
    expect(result.features).toContain('terraform');
    expect(result.augmentations).toContain('database:postgres');
    expect(result.augmentations).toContain('auth:nextauth');
    
    // Clean up
    delete process.env.CI;
    delete process.env.CREATE_FDE_APP_FRAMEWORK;
    delete process.env.CREATE_FDE_APP_DEPLOY_TARGET;
    delete process.env.CREATE_FDE_APP_FEATURES;
    delete process.env.CREATE_FDE_APP_AUGMENTATIONS;
  });
});