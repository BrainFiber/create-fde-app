#!/usr/bin/env node

import { join } from 'path';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import Handlebars from 'handlebars';

console.log('Testing Phase 3: Multi-Deploy Support...\n');

// Test 1: Check GitHub Actions templates
console.log('1. Checking GitHub Actions templates:');
const actionsDir = join(process.cwd(), 'deploy-templates', 'github-actions');
const actionFiles = await readdir(actionsDir);
for (const file of actionFiles) {
  if (file.endsWith('.yml')) {
    console.log(`   ✓ ${file} exists`);
    
    // Test Handlebars compilation
    try {
      const content = await readFile(join(actionsDir, file), 'utf-8');
      const template = Handlebars.compile(content);
      const rendered = template({
        projectName: 'test-app',
        awsRegion: 'us-east-1',
        gcpProjectId: 'test-project',
        gcpRegion: 'us-central1'
      });
      console.log(`     - Handlebars compilation: OK`);
    } catch (error) {
      console.log(`     ✗ Handlebars compilation failed: ${error.message}`);
    }
  }
}

// Test 2: Check Terraform templates
console.log('\n2. Checking Terraform templates:');
const terraformDir = join(process.cwd(), 'deploy-templates', 'terraform');
const terraformDirs = await readdir(terraformDir);
for (const dir of terraformDirs) {
  const tfDir = join(terraformDir, dir);
  if (existsSync(join(tfDir, 'main.tf'))) {
    console.log(`   ✓ ${dir}:`);
    const tfFiles = await readdir(tfDir);
    for (const file of tfFiles) {
      if (file.endsWith('.tf') || file.endsWith('.example')) {
        console.log(`     - ${file}`);
      }
    }
  }
}

// Test 3: Check Docker templates
console.log('\n3. Checking Docker templates:');
const dockerDir = join(process.cwd(), 'deploy-templates', 'docker');
const dockerDirs = await readdir(dockerDir);
for (const dir of dockerDirs) {
  const dockerfilePath = join(dockerDir, dir, 'Dockerfile');
  const dockerfileBasePath = join(dockerDir, dir, 'Dockerfile.base');
  if (existsSync(dockerfilePath)) {
    console.log(`   ✓ ${dir}/Dockerfile exists`);
  } else if (existsSync(dockerfileBasePath)) {
    console.log(`   ✓ ${dir}/Dockerfile.base exists`);
  }
}

// Test 4: Check deploy-injector updates
console.log('\n4. Checking deploy-injector.js:');
const deployInjectorPath = join(process.cwd(), 'lib', 'deploy-injector.js');
if (existsSync(deployInjectorPath)) {
  const content = await readFile(deployInjectorPath, 'utf-8');
  
  // Check for key functions
  const functions = [
    'addGitHubActions',
    'addTerraformConfig',
    'addVercelConfig',
    'getDeploymentInstructions'
  ];
  
  for (const func of functions) {
    if (content.includes(`function ${func}`)) {
      console.log(`   ✓ ${func} function exists`);
    } else {
      console.log(`   ✗ ${func} function missing`);
    }
  }
  
  // Check for Handlebars usage
  if (content.includes('Handlebars.compile')) {
    console.log('   ✓ Handlebars template compilation implemented');
  }
}

// Test 5: Check prompts.js updates
console.log('\n5. Checking prompts.js:');
const promptsPath = join(process.cwd(), 'lib', 'prompts.js');
if (existsSync(promptsPath)) {
  const content = await readFile(promptsPath, 'utf-8');
  
  if (content.includes('promptDeploymentConfig')) {
    console.log('   ✓ promptDeploymentConfig function exists');
    
    // Check for deployment-specific prompts
    const deployTargets = ['aws-apprunner', 'gcp-cloudrun', 'vercel'];
    for (const target of deployTargets) {
      if (content.includes(`case '${target}':`)) {
        console.log(`   ✓ ${target} configuration prompts exist`);
      }
    }
  }
}

console.log('\n✅ Phase 3 deployment infrastructure test completed!');