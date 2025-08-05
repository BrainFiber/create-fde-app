// Mock answers for testing prompts
export const defaultAnswers = {
  framework: 'nextjs',
  deployTarget: 'aws-apprunner',
  features: ['docker', 'github-actions'],
  augmentations: [],
  initGit: true,
  installDeps: true
};

export const minimalAnswers = {
  framework: 'nextjs',
  deployTarget: 'vercel',
  features: [],
  augmentations: [],
  initGit: false,
  installDeps: false
};

export const fullFeaturesAnswers = {
  framework: 'nextjs',
  deployTarget: 'aws-apprunner',
  features: ['docker', 'github-actions', 'terraform'],
  augmentations: [
    'database:postgres',
    'auth:nextauth',
    'monitoring:datadog',
    'utility:sentry',
    'utility:logging',
    'utility:rate-limiting',
    'utility:cors'
  ],
  initGit: true,
  installDeps: true
};

export const nuxtAnswers = {
  framework: 'nuxtjs',
  deployTarget: 'gcp-cloudrun',
  features: ['docker', 'github-actions'],
  augmentations: ['database:mysql', 'auth:auth0'],
  initGit: true,
  installDeps: false
};

export const remixAnswers = {
  framework: 'remix',
  deployTarget: 'vercel',
  features: ['docker'],
  augmentations: ['database:mongodb', 'auth:cognito'],
  initGit: true,
  installDeps: false
};