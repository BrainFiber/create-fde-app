# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-14

### Added
- Comprehensive AI-optimized help system for Claude Code and other AI agents
- New `--help-ai` flag that outputs structured JSON for programmatic parsing
- Extensive CI mode documentation in help output with copy-paste ready examples
- AI agent usage section in CLAUDE.md with validation rules and error prevention tips
- Complete environment variable reference with detailed descriptions

### Changed
- Updated branding to BrainFiber Inc.
- Enhanced help documentation with framework details, deployment targets, and augmentation compatibility matrix

### Improved
- Vercel deployment workflow
- Help output now includes common AI agent mistakes to avoid
- Documentation structure for better AI agent compatibility

## [0.1.0] - 2025-01-05

### Added
- Initial release of create-fde-app
- Support for three major frameworks: Next.js, Nuxt.js, and Remix
- Three deployment targets: AWS App Runner, Vercel, and Google Cloud Run
- Docker containerization support with optimized Dockerfiles for each framework
- GitHub Actions CI/CD workflows for automated deployments
- Terraform infrastructure as code for AWS and GCP deployments
- Comprehensive augmentation system:
  - **Authentication**: NextAuth.js, Auth0, AWS Cognito
  - **Databases**: PostgreSQL, MySQL, MongoDB with ORM/ODM setup
  - **Monitoring**: Datadog APM & RUM integration
  - **Utilities**: Sentry error tracking, Winston logging, rate limiting, CORS
- Non-interactive mode for CI/CD environments
- Monorepo support with `--monorepo` flag
- Automatic git initialization
- Interactive prompts with sensible defaults
- Framework-specific post-processing and optimizations
- Comprehensive test suite with Jest
- TypeScript support for generated projects
- ESLint and Prettier configurations

### Security
- Automated dependency vulnerability scanning
- GitHub Dependabot integration
- Security audit workflow in CI/CD
- No hardcoded secrets or sensitive data
- Proper environment variable management

### Performance
- Removed unused dependencies
- Optimized bundle size
- Fast installation with yarn package manager
- Minimal production dependencies

[0.2.0]: https://github.com/BrainFiber/create-fde-app/releases/tag/v0.2.0
[0.1.0]: https://github.com/BrainFiber/create-fde-app/releases/tag/v0.1.0