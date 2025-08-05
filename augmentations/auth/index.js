import { setupNextAuth } from './nextauth/setup.js';
import { setupAuth0 } from './auth0/setup.js';
import { setupCognito } from './cognito/setup.js';

export const authSetups = {
  nextauth: setupNextAuth,
  auth0: setupAuth0,
  cognito: setupCognito,
};

export async function setupAuth(projectPath, framework, authType) {
  const setupFunction = authSetups[authType];
  
  if (!setupFunction) {
    throw new Error(`Unknown auth type: ${authType}`);
  }

  await setupFunction(projectPath, framework);
}