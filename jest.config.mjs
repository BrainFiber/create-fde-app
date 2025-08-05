/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.js$': ['ts-jest', {
      useESM: true,
    }],
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
  collectCoverageFrom: [
    'lib/**/*.js',
    'post-processors/**/*.js',
    'augmentations/**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
}

export default config;