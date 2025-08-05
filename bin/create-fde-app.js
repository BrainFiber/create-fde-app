#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { runCLI } from '../lib/cli.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

console.log(`create-fde-app v${packageJson.version}`);

runCLI().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});