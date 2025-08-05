import { jest } from '@jest/globals';
import { processAugmentations } from '../../lib/augmentations-processor.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Mock logger
jest.mock('../../lib/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock augmentation modules
const mockSetupDatabase = jest.fn();
const mockSetupAuth = jest.fn();
const mockSetupMonitoring = jest.fn();
const mockSetupUtility = jest.fn();

// Mock dynamic imports
jest.unstable_mockModule('../../augmentations/database/index.js', () => ({
  setupDatabase: mockSetupDatabase
}));

jest.unstable_mockModule('../../augmentations/auth/index.js', () => ({
  setupAuth: mockSetupAuth
}));

jest.unstable_mockModule('../../augmentations/monitoring/index.js', () => ({
  setupMonitoring: mockSetupMonitoring
}));

jest.unstable_mockModule('../../augmentations/utilities/index.js', () => ({
  setupUtility: mockSetupUtility
}));

describe('AugmentationsProcessor', () => {
  const mockProjectPath = '/test/project';
  const mockFramework = 'nextjs';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetupDatabase.mockResolvedValue();
    mockSetupAuth.mockResolvedValue();
    mockSetupMonitoring.mockResolvedValue();
    mockSetupUtility.mockResolvedValue();
  });

  test('should process database augmentation', async () => {
    const augmentations = ['database:postgres'];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    expect(mockSetupDatabase).toHaveBeenCalledWith(
      mockProjectPath,
      mockFramework,
      'postgres'
    );
  });

  test('should process auth augmentation', async () => {
    const augmentations = ['auth:nextauth'];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    expect(mockSetupAuth).toHaveBeenCalledWith(
      mockProjectPath,
      mockFramework,
      'nextauth'
    );
  });

  test('should process monitoring augmentation', async () => {
    const augmentations = ['monitoring:datadog'];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    expect(mockSetupMonitoring).toHaveBeenCalledWith(
      mockProjectPath,
      mockFramework,
      'datadog'
    );
  });

  test('should process utility augmentation', async () => {
    const augmentations = ['utility:sentry'];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    expect(mockSetupUtility).toHaveBeenCalledWith(
      mockProjectPath,
      mockFramework,
      'sentry'
    );
  });

  test('should process multiple augmentations', async () => {
    const augmentations = [
      'database:postgres',
      'auth:nextauth',
      'monitoring:datadog',
      'utility:sentry'
    ];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    expect(mockSetupDatabase).toHaveBeenCalledTimes(1);
    expect(mockSetupAuth).toHaveBeenCalledTimes(1);
    expect(mockSetupMonitoring).toHaveBeenCalledTimes(1);
    expect(mockSetupUtility).toHaveBeenCalledTimes(1);
  });

  test('should handle unknown augmentation category gracefully', async () => {
    const augmentations = ['unknown:feature'];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    // Should not throw error
    expect(mockSetupDatabase).not.toHaveBeenCalled();
    expect(mockSetupAuth).not.toHaveBeenCalled();
    expect(mockSetupMonitoring).not.toHaveBeenCalled();
    expect(mockSetupUtility).not.toHaveBeenCalled();
  });

  test('should continue processing if one augmentation fails', async () => {
    mockSetupDatabase.mockRejectedValue(new Error('Database setup failed'));
    
    const augmentations = [
      'database:postgres',
      'auth:nextauth'
    ];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    expect(mockSetupDatabase).toHaveBeenCalled();
    expect(mockSetupAuth).toHaveBeenCalled(); // Should still be called
  });

  test('should handle empty augmentations array', async () => {
    const augmentations = [];
    
    await processAugmentations(mockProjectPath, mockFramework, augmentations);
    
    expect(mockSetupDatabase).not.toHaveBeenCalled();
    expect(mockSetupAuth).not.toHaveBeenCalled();
    expect(mockSetupMonitoring).not.toHaveBeenCalled();
    expect(mockSetupUtility).not.toHaveBeenCalled();
  });

  test('should parse augmentation strings correctly', async () => {
    const testCases = [
      { input: 'database:mysql', expectedCategory: 'database', expectedType: 'mysql' },
      { input: 'auth:cognito', expectedCategory: 'auth', expectedType: 'cognito' },
      { input: 'utility:rate-limiting', expectedCategory: 'utility', expectedType: 'rate-limiting' }
    ];
    
    for (const testCase of testCases) {
      jest.clearAllMocks();
      
      await processAugmentations(mockProjectPath, mockFramework, [testCase.input]);
      
      switch (testCase.expectedCategory) {
        case 'database':
          expect(mockSetupDatabase).toHaveBeenCalledWith(
            mockProjectPath,
            mockFramework,
            testCase.expectedType
          );
          break;
        case 'auth':
          expect(mockSetupAuth).toHaveBeenCalledWith(
            mockProjectPath,
            mockFramework,
            testCase.expectedType
          );
          break;
        case 'utility':
          expect(mockSetupUtility).toHaveBeenCalledWith(
            mockProjectPath,
            mockFramework,
            testCase.expectedType
          );
          break;
      }
    }
  });
});