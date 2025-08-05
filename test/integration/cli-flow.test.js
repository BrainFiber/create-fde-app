import { jest } from '@jest/globals';
import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI Integration Tests', () => {
  const cliPath = join(__dirname, '../../bin/create-fde-app.js');
  
  test('should display help', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
    
    expect(output).toContain('create-fde-app');
    expect(output).toContain('--framework');
    expect(output).toContain('--deploy');
    expect(output).toContain('--skip-git');
    expect(output).toContain('--skip-install');
  });

  test('should display version', () => {
    const output = execSync(`node ${cliPath} --version`, { encoding: 'utf8' });
    expect(output).toContain('0.1.0');
  });
});