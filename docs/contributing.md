# Contributing to create-fde-app

Thank you for your interest in contributing to create-fde-app! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Contributions](#making-contributions)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read and follow our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/create-fde-app.git
   cd create-fde-app
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/fde/create-fde-app.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Docker (for testing containerization)
- A cloud provider account (for testing deployments)

### Local Development

1. **Create a test project**:
   ```bash
   node bin/create-fde-app.js test-app
   ```

2. **Use npm link for testing**:
   ```bash
   npm link
   create-fde-app test-app
   ```

3. **Run tests**:
   ```bash
   npm test
   npm run test:integration
   ```

## Project Structure

Understanding the project structure is crucial for contributing:

```
create-fde-app/
├── bin/
│   └── create-fde-app.js      # CLI entry point
├── lib/
│   ├── cli.js                 # Main CLI logic
│   ├── prompts.js             # Interactive prompts
│   ├── framework-wrapper.js   # Framework execution
│   ├── post-processor.js      # Post-processing logic
│   ├── deploy-injector.js     # Deployment configs
│   └── terraform-executor.js  # Terraform handling
├── config/
│   ├── frameworks.json        # Framework definitions
│   └── deploy-targets.json    # Deployment targets
├── post-processors/           # Framework-specific logic
├── deploy-templates/          # Deployment templates
├── augmentations/            # Additional features
└── test/                     # Test files
```

## Making Contributions

### Types of Contributions

1. **Bug Fixes**: Fix issues in existing functionality
2. **New Features**: Add new frameworks, deployment targets, or augmentations
3. **Documentation**: Improve or add documentation
4. **Tests**: Add or improve test coverage
5. **Performance**: Optimize existing code

### Contribution Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, documented code
   - Follow existing patterns
   - Add tests for new functionality

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `test:` Tests
   - `refactor:` Code refactoring
   - `chore:` Maintenance

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Adding New Features

### Adding a New Framework

1. **Update `config/frameworks.json`**:
   ```json
   {
     "yourframework": {
       "displayName": "Your Framework",
       "description": "Framework description",
       "createCommand": "create-your-framework",
       "defaultArgs": ["--typescript"],
       "runtime": "node",
       "port": 3000,
       "postProcessors": ["yourframework-specific"]
     }
   }
   ```

2. **Create post-processor** in `post-processors/yourframework/index.js`:
   ```javascript
   export async function process(projectPath, projectDetails) {
     // Framework-specific processing
   }
   ```

3. **Add Docker template** in `deploy-templates/docker/yourframework/Dockerfile`

4. **Update documentation**

5. **Add tests**

### Adding a New Deployment Target

1. **Update `config/deploy-targets.json`**:
   ```json
   {
     "your-target": {
       "displayName": "Your Target",
       "requirements": ["docker"],
       "terraform": true,
       "githubActions": "your-target.yml",
       "supportedRuntimes": ["node", "python"]
     }
   }
   ```

2. **Create GitHub Actions template** in `deploy-templates/github-actions/your-target.yml`

3. **Add Terraform modules** if applicable in `deploy-templates/terraform/your-target/`

4. **Update deployment logic** in `lib/deploy-injector.js`

5. **Add documentation and tests**

### Adding a New Augmentation

1. **Create directory structure**:
   ```
   augmentations/
   └── category/
       └── your-feature/
           ├── setup.js
           ├── templates/
           └── README.md
   ```

2. **Implement setup.js**:
   ```javascript
   export async function setup(projectPath, framework) {
     // Installation and configuration logic
   }
   ```

3. **Update `lib/prompts.js`** to include your augmentation

4. **Add to augmentations processor**

5. **Document and test**

## Testing

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- test/unit

# Integration tests
npm run test:integration

# Test coverage
npm run test:coverage

# Specific test file
npm test -- test/unit/cli.test.js
```

### Writing Tests

1. **Unit Tests**: Test individual functions
   ```javascript
   import { describe, test, expect } from '@jest/globals';
   
   describe('MyFeature', () => {
     test('should work correctly', () => {
       expect(myFunction()).toBe(expected);
     });
   });
   ```

2. **Integration Tests**: Test full workflows
   ```javascript
   test('should create Next.js project with Docker', () => {
     // Test complete flow
   });
   ```

### Test Guidelines

- Write tests for all new features
- Maintain or improve code coverage
- Test edge cases and error conditions
- Use meaningful test descriptions
- Mock external dependencies

## Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up to date
- Use proper markdown formatting
- Add screenshots for UI features

### Documentation Structure

1. **API Documentation**: Document all public functions
2. **User Guides**: Step-by-step instructions
3. **Configuration**: Explain all options
4. **Examples**: Provide real-world examples

### Where to Document

- `README.md`: General overview and quick start
- `docs/`: Detailed guides
- Code comments: Implementation details
- `CHANGELOG.md`: Version history

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **Update documentation** if needed

4. **Add tests** for new functionality

### PR Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Screenshots**: Include for UI changes
4. **Testing**: Describe how to test
5. **Breaking Changes**: Clearly mark

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** verification
4. **Documentation** review
5. **Approval and merge**

## Style Guidelines

### Code Style

- Use ES modules
- Prefer async/await over callbacks
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

### Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat(frameworks): add SvelteKit support

- Add framework configuration
- Create post-processor
- Add Docker template
- Update documentation

Closes #123
```

## Getting Help

- **Discord**: Join our community Discord
- **Issues**: Check existing issues
- **Discussions**: Ask questions
- **Email**: contact@create-fde-app.dev

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing to create-fde-app! 🎉