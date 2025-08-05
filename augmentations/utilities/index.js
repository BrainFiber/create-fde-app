import { setupSentry } from './sentry/setup.js';
import { setupLogging } from './logging/setup.js';
import { setupRateLimiting } from './rate-limiting/setup.js';
import { setupCORS } from './cors/setup.js';

export const utilitySetups = {
  sentry: setupSentry,
  logging: setupLogging,
  'rate-limiting': setupRateLimiting,
  cors: setupCORS,
};

export async function setupUtility(projectPath, framework, utilityType) {
  const setupFunction = utilitySetups[utilityType];
  
  if (!setupFunction) {
    throw new Error(`Unknown utility type: ${utilityType}`);
  }

  await setupFunction(projectPath, framework);
}