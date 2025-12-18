# Contributing to MAS-UI

Thank you for your interest in contributing to MAS-UI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check existing issues to avoid duplicates
2. Use the issue templates when available
3. Include relevant information:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node version)
   - Error messages or screenshots if applicable

### Suggesting Features

We welcome feature suggestions! Please:
1. Check if the feature has already been suggested
2. Provide a clear use case
3. Explain how it benefits users
4. Consider implementation complexity

### Pull Requests

#### Before You Start

1. **Fork the repository** and create a new branch from `main`
2. **Discuss major changes** by opening an issue first
3. **Follow the existing code style** and conventions
4. **Write tests** for new functionality when applicable

#### Development Setup

1. **Fork and clone the repository:**
```bash
git clone https://github.com/[your-username]/mas-tmux.git
cd mas-tmux
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

4. **Set up environment:**
```bash
cp .env.example .env
# Configure your local API endpoint in .env
```

5. **Start development:**
```bash
npm run dev
```

#### Code Style Guidelines

- **TypeScript**: Use proper typing, avoid `any` when possible
- **React**: Follow React best practices and hooks guidelines
- **Components**: Keep components focused and reusable
- **Naming**: Use descriptive names for variables, functions, and components
- **Comments**: Add comments for complex logic
- **Formatting**: Code is automatically formatted with the project's ESLint configuration

Run linting before committing:
```bash
npm run lint
```

Type checking:
```bash
npm run type-check
```

#### Commit Messages

Follow conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

Examples:
```
feat: add session export functionality
fix: resolve API timeout issue in agent configuration
docs: update deployment guide for Vercel
```

#### Testing Your Changes

1. **Test locally:** Ensure your changes work as expected
2. **Cross-browser testing:** Test in multiple browsers if applicable
3. **Build test:** Ensure production build works
```bash
npm run build
npm run preview
```

#### Submitting a Pull Request

1. **Push your branch:**
```bash
git push origin feature/your-feature-name
```

2. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Link to related issues
   - Screenshots or GIFs for UI changes
   - List of changes made
   - Testing steps

3. **Respond to feedback:** Address review comments promptly

### Documentation

Help improve our documentation:
- Fix typos or clarify instructions
- Add examples or use cases
- Translate documentation
- Update API documentation

## Project Structure

```
mas-ui/
├── src/
│   ├── components/      # React components
│   │   └── *.tsx        # Component files
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and external services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main application
├── docs/                # Documentation
│   └── deployment/      # Deployment guides
├── public/              # Static assets
└── tests/               # Test files
```

## Development Tips

### Working with the MAS API

- The API endpoint is configured via `VITE_API_BASE_URL`
- API types are defined in `src/types/masApi.ts`
- API integration is handled in `src/services/masApi.ts`

### Component Development

- Components are in `src/components/`
- Use TypeScript interfaces for props
- Keep components focused and testable
- Use custom hooks for complex logic

### State Management

- Uses React's built-in state management
- Complex forms use `useReducer`
- Custom hooks in `src/hooks/`

## Getting Help

- 📖 Check the [documentation](docs/)
- 💬 Open a [discussion](https://github.com/Frexida/mas-tmux/discussions)
- 🐛 Report [issues](https://github.com/Frexida/mas-tmux/issues)

## Recognition

Contributors will be recognized in:
- The project's contributors list
- Release notes for significant contributions
- Special mentions for exceptional contributions

Thank you for contributing to MAS-UI! 🎉