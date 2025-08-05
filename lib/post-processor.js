import { join } from 'path';
import { logger } from './utils/logger.js';
import { initGit } from './utils/git.js';
import { postProcessorLoader } from './post-processor-loader.js';
import { processAugmentations } from './augmentations-processor.js';

export async function processProject(projectDetails) {
  const { projectName, framework, initGit: shouldInitGit, augmentations } = projectDetails;
  const projectPath = join(process.cwd(), projectName);

  logger.startSpinner('Processing project...');

  try {
    // Use the new post-processor system
    await postProcessorLoader.process(framework, projectPath, projectDetails);

    // Process augmentations if any selected
    if (augmentations && augmentations.length > 0) {
      logger.startSpinner('Adding advanced features...');
      await processAugmentations(projectPath, framework, augmentations);
      logger.stopSpinner(true, 'Advanced features added!');
    }

    // Initialize git if requested
    if (shouldInitGit) {
      await initGit(projectPath);
    }

    logger.stopSpinner(true, 'Project processed successfully!');
  } catch (error) {
    logger.stopSpinner(false, 'Failed to process project');
    throw error;
  }
}

// Legacy functions removed - now handled by framework-specific post-processors