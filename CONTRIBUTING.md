# Contributing to MAS (Multi-Agent System)

Thank you for your interest in contributing to MAS! This document provides guidelines for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a welcoming environment for all contributors.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Use clear, descriptive titles
- Include steps to reproduce bugs
- Provide system information (OS, tmux version, etc.)

### Suggesting Features

- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Explain why it would benefit the project

### Code Contributions

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/mas.git
   cd mas
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Use meaningful commit messages
   - Test your changes thoroughly

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure all tests pass

## Commit Message Convention

We follow conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

## Code Style Guidelines

### Shell Scripts
- Use consistent indentation (2 spaces)
- Include proper error handling
- Add comments for complex logic
- Use `shellcheck` for validation

### TypeScript/JavaScript
- Follow ESLint configuration
- Use TypeScript for API code
- Include JSDoc comments

## Testing

Before submitting:

1. Test all shell scripts:
   ```bash
   shellcheck lib/*.sh mas-core.sh
   ```

2. Test API endpoints:
   ```bash
   npm test
   ```

3. Run integration tests:
   ```bash
   ./tests/run-integration-tests.sh
   ```

## Documentation

- Update README.md if adding features
- Document new API endpoints in `api/README.md`
- Add examples to the `examples/` directory
- Update CHANGELOG.md with your changes

## Development Setup

1. Install dependencies:
   ```bash
   ./scripts/install.sh
   ```

2. Set up development environment:
   ```bash
   export MAS_DEBUG=1
   ```

3. Run in development mode:
   ```bash
   ./mas --dev
   ```

## Getting Help

- Join our discussions on GitHub
- Check the documentation in `docs/`
- Ask questions in issues with the "question" label

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for their specific contributions
- README.md contributors section
- Release notes

Thank you for contributing to MAS!