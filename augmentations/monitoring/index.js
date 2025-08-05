import { setupDatadog } from './datadog/setup.js';

export const monitoringSetups = {
  datadog: setupDatadog,
  // TODO: Add New Relic and CloudWatch setups
};

export async function setupMonitoring(projectPath, framework, monitoringType) {
  const setupFunction = monitoringSetups[monitoringType];
  
  if (!setupFunction) {
    throw new Error(`Unknown monitoring type: ${monitoringType}`);
  }

  await setupFunction(projectPath, framework);
}