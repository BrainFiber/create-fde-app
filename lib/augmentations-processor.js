import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from './utils/logger.js';

let setupDatabase, setupAuth, setupMonitoring, setupUtility;

// Dynamic imports to avoid module resolution issues
async function loadAugmentationModules() {
  const basePath = join(dirname(fileURLToPath(import.meta.url)), '..');
  
  setupDatabase = (await import(join(basePath, 'augmentations/database/index.js'))).setupDatabase;
  setupAuth = (await import(join(basePath, 'augmentations/auth/index.js'))).setupAuth;
  setupMonitoring = (await import(join(basePath, 'augmentations/monitoring/index.js'))).setupMonitoring;
  setupUtility = (await import(join(basePath, 'augmentations/utilities/index.js'))).setupUtility;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function processAugmentations(projectPath, framework, augmentations) {
  logger.info(`Processing ${augmentations.length} augmentations...`);

  // Load augmentation modules first
  await loadAugmentationModules();

  for (const augmentation of augmentations) {
    await processAugmentation(projectPath, framework, augmentation);
  }
}

async function processAugmentation(projectPath, framework, augmentation) {
  const [category, type] = augmentation.split(':');
  
  logger.info(`Adding ${type} (${category})...`);

  try {
    switch (category) {
      case 'database':
        await setupDatabase(projectPath, framework, type);
        break;
      
      case 'auth':
        await setupAuth(projectPath, framework, type);
        break;
      
      case 'monitoring':
        await setupMonitoring(projectPath, framework, type);
        break;
      
      case 'utility':
        await setupUtility(projectPath, framework, type);
        break;
      
      default:
        logger.warn(`Unknown augmentation category: ${category}`);
    }
  } catch (error) {
    logger.error(`Failed to add ${augmentation}: ${error.message}`);
    // Continue with other augmentations even if one fails
  }
}