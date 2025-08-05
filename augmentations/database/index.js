import { setupPostgres } from './postgres/setup.js';
import { setupMySQL } from './mysql/setup.js';
import { setupMongoDB } from './mongodb/setup.js';

export const databaseSetups = {
  postgres: setupPostgres,
  mysql: setupMySQL,
  mongodb: setupMongoDB,
};

export async function setupDatabase(projectPath, framework, databaseType) {
  const setupFunction = databaseSetups[databaseType];
  
  if (!setupFunction) {
    throw new Error(`Unknown database type: ${databaseType}`);
  }

  await setupFunction(projectPath, framework);
}