import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('FrameworkWrapper', () => {
  let frameworks;
  
  beforeEach(() => {
    // Load framework configuration
    const configPath = join(__dirname, '../../config/frameworks.json');
    frameworks = JSON.parse(readFileSync(configPath, 'utf8'));
  });

  test('should have valid framework configurations', () => {
    expect(Object.keys(frameworks).length).toBeGreaterThan(0);
    expect(frameworks).toHaveProperty('nextjs');
    expect(frameworks).toHaveProperty('nuxtjs');
    expect(frameworks).toHaveProperty('remix');
  });

  test('should validate all configured frameworks have required fields', () => {
    Object.entries(frameworks).forEach(([key, config]) => {
      expect(config).toHaveProperty('displayName');
      expect(config).toHaveProperty('createCommand');
      expect(config).toHaveProperty('runtime');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('buildCommand');
      expect(config).toHaveProperty('startCommand');
      expect(config).toHaveProperty('devCommand');
      
      // Validate runtime is valid
      expect(['node', 'python']).toContain(config.runtime);
      
      // Validate port is a number
      expect(typeof config.port).toBe('number');
      
      // Validate commands use yarn
      expect(config.buildCommand).toContain('yarn');
      expect(config.startCommand).toContain('yarn');
      expect(config.devCommand).toContain('yarn');
    });
  });

  test('should have proper Next.js configuration', () => {
    const nextjs = frameworks.nextjs;
    expect(nextjs.displayName).toBe('Next.js');
    expect(nextjs.createCommand).toContain('create-next-app');
    expect(nextjs.port).toBe(3000);
  });

  test('should have proper Nuxt.js configuration', () => {
    const nuxtjs = frameworks.nuxtjs;
    expect(nuxtjs.displayName).toBe('Nuxt.js');
    expect(nuxtjs.createCommand).toContain('nuxi');
    expect(nuxtjs.port).toBe(3000);
  });

  test('should have proper Remix configuration', () => {
    const remix = frameworks.remix;
    expect(remix.displayName).toBe('Remix');
    expect(remix.createCommand).toContain('create-remix');
    expect(remix.port).toBe(3000);
  });
});