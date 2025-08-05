#!/usr/bin/env node

import { postProcessorLoader } from '../lib/post-processor-loader.js';
import { join } from 'path';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';

console.log('Testing Framework Support...\n');

// Test 1: Check available post-processors
console.log('1. Checking available post-processors:');
const availableProcessors = await postProcessorLoader.getAvailableProcessors();
console.log(`   Found: ${availableProcessors.join(', ')}`);
console.log(`   ✓ Total: ${availableProcessors.length} post-processors\n`);

// Test 2: Check Docker templates
console.log('2. Checking Docker templates:');
const dockerTemplatesDir = join(process.cwd(), 'deploy-templates', 'docker');
const dockerDirs = await readdir(dockerTemplatesDir);
for (const dir of dockerDirs) {
  const dockerfilePath = join(dockerTemplatesDir, dir, 'Dockerfile');
  if (dir !== 'common' && existsSync(dockerfilePath)) {
    console.log(`   ✓ ${dir}: Dockerfile exists`);
  } else if (dir === 'common') {
    const basePath = join(dockerTemplatesDir, dir, 'Dockerfile.base');
    if (existsSync(basePath)) {
      console.log(`   ✓ ${dir}: Dockerfile.base exists`);
    }
  }
}

// Test 3: Check framework configurations
console.log('\n3. Checking framework configurations:');
const frameworksConfigPath = join(process.cwd(), 'config', 'frameworks.json');
if (existsSync(frameworksConfigPath)) {
  const frameworksModule = await import('../config/frameworks.json', { with: { type: 'json' } });
  const frameworks = frameworksModule.default;
  for (const [key, config] of Object.entries(frameworks)) {
    console.log(`   ✓ ${key}: ${config.displayName} - ${config.createCommand}`);
  }
}

// Test 4: Test post-processor loading
console.log('\n4. Testing post-processor loading:');
const testFrameworks = ['nextjs', 'nuxtjs', 'remix'];
for (const framework of testFrameworks) {
  try {
    const processor = await postProcessorLoader.loadProcessor(
      framework,
      '/tmp/test-project',
      { features: [], frameworkConfig: { port: 3000 } }
    );
    console.log(`   ✓ ${framework}: Successfully loaded ${processor.constructor.name}`);
  } catch (error) {
    console.log(`   ✗ ${framework}: Failed to load - ${error.message}`);
  }
}

console.log('\n✅ Phase 2 implementation test completed!');