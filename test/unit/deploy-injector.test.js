import { jest } from '@jest/globals';
import { injectDeployConfig } from '../../lib/deploy-injector.js';
import { readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { executeTerraform } from '../../lib/terraform-executor.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('../../lib/terraform-executor.js');
jest.mock('../../lib/utils/logger.js', () => ({
  logger: {
    startSpinner: jest.fn(),
    stopSpinner: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('DeployInjector', () => {
  const mockProjectDetails = {
    projectName: 'test-app',
    framework: 'nextjs',
    deployTarget: 'aws-apprunner',
    features: ['docker', 'github-actions'],
    deployConfig: {
      terraform: true,
      awsRegion: 'us-east-1'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    existsSync.mockReturnValue(true);
    readFile.mockResolvedValue('template content');
    writeFile.mockResolvedValue();
    mkdir.mockResolvedValue();
    copyFile.mockResolvedValue();
    executeTerraform.mockResolvedValue();
  });

  describe('injectDeployConfig', () => {
    test('should add Docker configuration when docker feature is selected', async () => {
      await injectDeployConfig(mockProjectDetails);
      
      // Check Dockerfile was written
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('Dockerfile'),
        expect.any(String)
      );
      
      // Check .dockerignore was written
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.dockerignore'),
        expect.any(String)
      );
    });

    test('should add GitHub Actions workflow when github-actions feature is selected', async () => {
      await injectDeployConfig(mockProjectDetails);
      
      // Check workflow directory was created
      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.github/workflows'),
        { recursive: true }
      );
      
      // Check workflow file was written
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('deploy.yml'),
        expect.any(String)
      );
    });

    test('should execute Terraform when terraform feature is selected', async () => {
      await injectDeployConfig(mockProjectDetails);
      
      expect(executeTerraform).toHaveBeenCalledWith(
        expect.any(String),
        'aws-apprunner',
        mockProjectDetails
      );
    });

    test('should skip Terraform when not in features', async () => {
      const projectDetails = {
        ...mockProjectDetails,
        features: ['docker'],
        deployConfig: { terraform: false }
      };
      
      await injectDeployConfig(projectDetails);
      
      expect(executeTerraform).not.toHaveBeenCalled();
    });

    test('should add Vercel configuration for Vercel deployment', async () => {
      const vercelDetails = {
        ...mockProjectDetails,
        deployTarget: 'vercel',
        features: []
      };
      
      await injectDeployConfig(vercelDetails);
      
      // Check vercel.json was written
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('vercel.json'),
        expect.stringContaining('"regions"')
      );
    });

    test('should use framework-specific Docker template when available', async () => {
      readFile.mockImplementation((path) => {
        if (path.includes('nextjs/Dockerfile')) {
          return Promise.resolve('NextJS specific Dockerfile');
        }
        return Promise.resolve('Generic Dockerfile');
      });
      
      await injectDeployConfig(mockProjectDetails);
      
      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining('nextjs/Dockerfile'),
        'utf-8'
      );
    });

    test('should fall back to generic Docker template when framework-specific not found', async () => {
      readFile.mockImplementation((path) => {
        if (path.includes('nextjs/Dockerfile')) {
          return Promise.reject(new Error('File not found'));
        }
        if (path.includes('common/Dockerfile.base')) {
          return Promise.resolve('Generic Dockerfile');
        }
        return Promise.resolve('template');
      });
      
      await injectDeployConfig(mockProjectDetails);
      
      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining('common/Dockerfile.base'),
        'utf-8'
      );
    });

    test('should handle errors gracefully', async () => {
      writeFile.mockRejectedValue(new Error('Write failed'));
      
      await expect(injectDeployConfig(mockProjectDetails))
        .rejects
        .toThrow('Write failed');
    });
  });

  describe('GitHub Actions templates', () => {
    test('should use correct template for AWS App Runner', async () => {
      await injectDeployConfig(mockProjectDetails);
      
      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining('aws-apprunner.yml'),
        'utf-8'
      );
    });

    test('should use correct template for Google Cloud Run', async () => {
      const gcpDetails = {
        ...mockProjectDetails,
        deployTarget: 'gcp-cloudrun',
        deployConfig: {
          gcpProjectId: 'test-project',
          gcpRegion: 'us-central1'
        }
      };
      
      await injectDeployConfig(gcpDetails);
      
      expect(readFile).toHaveBeenCalledWith(
        expect.stringContaining('gcp-cloudrun.yml'),
        'utf-8'
      );
    });

    test('should skip GitHub Actions for unsupported deploy targets', async () => {
      const unsupportedDetails = {
        ...mockProjectDetails,
        deployTarget: 'unsupported-target',
        features: ['github-actions']
      };
      
      await injectDeployConfig(unsupportedDetails);
      
      // Should still create directory but not write workflow
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalledWith(
        expect.stringContaining('deploy.yml'),
        expect.any(String)
      );
    });
  });
});