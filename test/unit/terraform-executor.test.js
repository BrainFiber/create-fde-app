import { jest } from '@jest/globals';
import { TerraformExecutor } from '../../lib/terraform-executor.js';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import Handlebars from 'handlebars';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('handlebars');

describe('TerraformExecutor', () => {
  let executor;
  const mockProjectPath = '/test/project';
  const mockDeployTarget = 'aws-apprunner';
  const mockProjectDetails = {
    projectName: 'test-app',
    framework: 'nextjs',
    deployConfig: {
      awsRegion: 'us-east-1',
      awsAccountId: '123456789012'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new TerraformExecutor(mockProjectPath, mockDeployTarget, mockProjectDetails);
    
    // Default mock implementations
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue('mock file content');
    Handlebars.compile.mockReturnValue((data) => JSON.stringify(data));
  });

  describe('checkTerraformInstalled', () => {
    test('should return true when terraform is installed', async () => {
      execSync.mockReturnValue('Terraform v1.5.0\n');
      
      const result = await executor.checkTerraformInstalled();
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('terraform version', { encoding: 'utf8' });
    });

    test('should return false when terraform is not installed', async () => {
      execSync.mockImplementation(() => {
        throw new Error('command not found');
      });
      
      const result = await executor.checkTerraformInstalled();
      
      expect(result).toBe(false);
    });
  });

  describe('generateTfvars', () => {
    test('should generate tfvars file from template', async () => {
      const templatePath = `${mockProjectPath}/terraform/terraform.tfvars.example`;
      
      await executor.generateTfvars();
      
      expect(readFileSync).toHaveBeenCalledWith(templatePath, 'utf-8');
      expect(Handlebars.compile).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalledWith(
        `${mockProjectPath}/terraform/terraform.tfvars`,
        expect.any(String)
      );
    });

    test('should not generate tfvars if already exists', async () => {
      existsSync.mockImplementation((path) => 
        path.endsWith('terraform.tfvars') ? true : false
      );
      
      await executor.generateTfvars();
      
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    test('should handle missing template file', async () => {
      existsSync.mockImplementation((path) => 
        path.endsWith('.example') ? false : true
      );
      
      await expect(executor.generateTfvars()).resolves.not.toThrow();
    });
  });

  describe('initTerraform', () => {
    test('should initialize terraform successfully', async () => {
      execSync.mockReturnValue('Terraform initialized');
      
      await executor.initTerraform();
      
      expect(execSync).toHaveBeenCalledWith(
        'terraform init',
        expect.objectContaining({
          cwd: `${mockProjectPath}/terraform`,
          stdio: 'inherit'
        })
      );
    });

    test('should throw error on initialization failure', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Init failed');
      });
      
      await expect(executor.initTerraform())
        .rejects
        .toThrow('Failed to initialize Terraform');
    });
  });

  describe('planTerraform', () => {
    test('should create terraform plan', async () => {
      execSync.mockReturnValue('Plan created');
      
      const result = await executor.planTerraform();
      
      expect(execSync).toHaveBeenCalledWith(
        'terraform plan -out=tfplan',
        expect.objectContaining({
          cwd: `${mockProjectPath}/terraform`,
          stdio: 'inherit'
        })
      );
      expect(result).toBe(true);
    });

    test('should handle planning errors', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Plan failed');
      });
      
      const result = await executor.planTerraform();
      
      expect(result).toBe(false);
    });
  });

  describe('applyTerraform', () => {
    test('should apply terraform plan when auto-approve is true', async () => {
      execSync.mockReturnValue('Apply complete');
      
      await executor.applyTerraform(true);
      
      expect(execSync).toHaveBeenCalledWith(
        'terraform apply -auto-approve tfplan',
        expect.objectContaining({
          cwd: `${mockProjectPath}/terraform`,
          stdio: 'inherit'
        })
      );
    });

    test('should apply terraform without auto-approve', async () => {
      execSync.mockReturnValue('Apply complete');
      
      await executor.applyTerraform(false);
      
      expect(execSync).toHaveBeenCalledWith(
        'terraform apply tfplan',
        expect.objectContaining({
          cwd: `${mockProjectPath}/terraform`,
          stdio: 'inherit'
        })
      );
    });

    test('should throw error on apply failure', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Apply failed');
      });
      
      await expect(executor.applyTerraform())
        .rejects
        .toThrow('Failed to apply Terraform');
    });
  });

  describe('getOutputs', () => {
    test('should retrieve terraform outputs', async () => {
      const mockOutputs = {
        app_url: { value: 'https://app.example.com' },
        service_arn: { value: 'arn:aws:apprunner:...' }
      };
      
      execSync.mockReturnValue(JSON.stringify(mockOutputs));
      
      const result = await executor.getOutputs();
      
      expect(execSync).toHaveBeenCalledWith(
        'terraform output -json',
        expect.objectContaining({
          cwd: `${mockProjectPath}/terraform`,
          encoding: 'utf8'
        })
      );
      expect(result).toEqual(mockOutputs);
    });

    test('should return empty object on error', async () => {
      execSync.mockImplementation(() => {
        throw new Error('No outputs');
      });
      
      const result = await executor.getOutputs();
      
      expect(result).toEqual({});
    });
  });
});