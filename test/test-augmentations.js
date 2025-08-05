#!/usr/bin/env node

import { join } from 'path';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';

console.log('Testing Phase 4: Augmentations...\n');

// Test 1: Check augmentations directory structure
console.log('1. Checking augmentations directory structure:');
const augmentationsDir = join(process.cwd(), 'augmentations');

const expectedDirs = [
  'database/postgres',
  'database/mysql',
  'database/mongodb',
  'auth/nextauth',
  'auth/auth0',
  'auth/cognito',
  'monitoring/datadog',
  'utilities/sentry',
  'utilities/logging',
  'utilities/rate-limiting',
  'utilities/cors'
];

for (const dir of expectedDirs) {
  const fullPath = join(augmentationsDir, dir);
  if (existsSync(fullPath)) {
    console.log(`   ✓ ${dir} exists`);
  } else {
    console.log(`   ✗ ${dir} missing`);
  }
}

// Test 2: Check terraform-executor.js
console.log('\n2. Checking terraform-executor.js:');
const terraformExecutorPath = join(process.cwd(), 'lib', 'terraform-executor.js');
if (existsSync(terraformExecutorPath)) {
  console.log('   ✓ terraform-executor.js exists');
  
  // Check for key exports
  try {
    const module = await import(terraformExecutorPath);
    const exports = ['TerraformExecutor', 'executeTerraform'];
    for (const exp of exports) {
      if (module[exp]) {
        console.log(`   ✓ ${exp} exported`);
      } else {
        console.log(`   ✗ ${exp} not exported`);
      }
    }
  } catch (error) {
    console.log(`   ✗ Error importing module: ${error.message}`);
  }
} else {
  console.log('   ✗ terraform-executor.js missing');
}

// Test 3: Check augmentations processor
console.log('\n3. Checking augmentations-processor.js:');
const augProcessorPath = join(process.cwd(), 'lib', 'augmentations-processor.js');
if (existsSync(augProcessorPath)) {
  console.log('   ✓ augmentations-processor.js exists');
  
  try {
    const module = await import(augProcessorPath);
    if (module.processAugmentations) {
      console.log('   ✓ processAugmentations function exported');
    }
  } catch (error) {
    console.log(`   ✗ Error importing module: ${error.message}`);
  }
} else {
  console.log('   ✗ augmentations-processor.js missing');
}

// Test 4: Check database setup files
console.log('\n4. Checking database augmentations:');
const databases = ['postgres', 'mysql', 'mongodb'];
for (const db of databases) {
  const setupPath = join(augmentationsDir, 'database', db, 'setup.js');
  const schemaPath = join(augmentationsDir, 'database', db, 'schema.prisma');
  
  console.log(`   ${db}:`);
  if (existsSync(setupPath)) {
    console.log('     ✓ setup.js exists');
  } else {
    console.log('     ✗ setup.js missing');
  }
  
  if (existsSync(schemaPath)) {
    console.log('     ✓ schema.prisma exists');
  } else {
    console.log('     ✗ schema.prisma missing');
  }
}

// Test 5: Check auth setup files
console.log('\n5. Checking auth augmentations:');
const authTypes = ['nextauth', 'auth0', 'cognito'];
for (const auth of authTypes) {
  const setupPath = join(augmentationsDir, 'auth', auth, 'setup.js');
  
  if (existsSync(setupPath)) {
    console.log(`   ✓ ${auth}/setup.js exists`);
  } else {
    console.log(`   ✗ ${auth}/setup.js missing`);
  }
}

// Test 6: Check utility setup files
console.log('\n6. Checking utility augmentations:');
const utilities = ['sentry', 'logging', 'rate-limiting', 'cors'];
for (const util of utilities) {
  const setupPath = join(augmentationsDir, 'utilities', util, 'setup.js');
  
  if (existsSync(setupPath)) {
    console.log(`   ✓ ${util}/setup.js exists`);
  } else {
    console.log(`   ✗ ${util}/setup.js missing`);
  }
}

// Test 7: Check prompts.js updates
console.log('\n7. Checking prompts.js updates:');
const promptsPath = join(process.cwd(), 'lib', 'prompts.js');
if (existsSync(promptsPath)) {
  const { readFile } = await import('fs/promises');
  const content = await readFile(promptsPath, 'utf8');
  
  if (content.includes('augmentations')) {
    console.log('   ✓ augmentations field added to prompts');
  } else {
    console.log('   ✗ augmentations field missing from prompts');
  }
  
  if (content.includes('Terraform Infrastructure')) {
    console.log('   ✓ Terraform option added to features');
  } else {
    console.log('   ✗ Terraform option missing from features');
  }
}

console.log('\n✅ Phase 4 augmentations test completed!');