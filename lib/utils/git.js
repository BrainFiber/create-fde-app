import { execa } from 'execa';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from './logger.js';

export async function initGit(projectPath) {
  try {
    // Initialize git repository
    await execa('git', ['init'], { cwd: projectPath });
    
    // Create .gitignore if it doesn't exist
    const gitignoreContent = `# dependencies
node_modules/
.pnp/
.pnp.js

# testing
coverage/

# production
build/
dist/
.next/
.nuxt/
.cache/
out/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.production.local
.env.development.local
.env.test.local

# vercel
.vercel

# typescript
*.tsbuildinfo

# terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl

# IDE
.vscode/
.idea/
`;

    await writeFile(join(projectPath, '.gitignore'), gitignoreContent);
    
    // Make initial commit
    await execa('git', ['add', '.'], { cwd: projectPath });
    await execa('git', ['commit', '-m', 'Initial commit from create-fde-app'], { cwd: projectPath });
    
    logger.success('Git repository initialized');
  } catch (error) {
    logger.warn('Failed to initialize git repository: ' + error.message);
  }
}