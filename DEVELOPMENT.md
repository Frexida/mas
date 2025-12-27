# MAS Multi-Version Development Guide

## Overview

MAS now supports running multiple API and frontend versions simultaneously for parallel development, testing, and comparison. This guide explains how to use the new multi-version development environment.

## Architecture

```
localhost
├── API Services (Backend)
│   ├── :3001 → API v1 (stable)
│   ├── :3002 → API v2 (development)
│   └── :3003 → API v3 (experimental)
└── Web Applications (Frontend)
    ├── :5173 → Frontend v1 (stable)
    ├── :5174 → Frontend v2 (development)
    └── :5175 → Frontend v3 (experimental)
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- tmux
- git

### Installation

1. Install pnpm if not already installed:
```bash
npm install -g pnpm
```

2. Install dependencies:
```bash
pnpm install
```

### Starting Services

#### Start All Versions
```bash
# Using pnpm
pnpm dev:all

# Using tmux (recommended)
./scripts/tmux-dev.sh start
```

#### Start Specific Version
```bash
# Start only v1 (API + Frontend)
pnpm dev:v1

# Start only v2
pnpm dev:v2

# Start only v3
pnpm dev:v3
```

#### Start Individual Services
```bash
# Start only API v1
pnpm dev:api:v1

# Start only Frontend v2
pnpm dev:web:v2
```

### Health Monitoring

Check the status of all services:
```bash
pnpm health
```

Watch mode for continuous monitoring:
```bash
pnpm health --watch
```

## Directory Structure

```
mas/
├── api/
│   ├── core/           # Shared modules
│   ├── v1/            # API v1 (port 3001)
│   ├── v2/            # API v2 (port 3002)
│   └── v3/            # API v3 (port 3003)
├── frontend/
│   ├── v1/            # Frontend v1 (port 5173)
│   ├── v2/            # Frontend v2 (port 5174)
│   └── v3/            # Frontend v3 (port 5175)
└── scripts/
    ├── health-check.js
    ├── tmux-dev.sh
    └── worktree-manager.sh
```

## Working with Git Worktrees

Git worktrees allow you to work on multiple branches simultaneously with isolated environments.

### Create a Worktree
```bash
./scripts/worktree-manager.sh create feature-branch
```

This will:
- Create a new worktree at `../mas-worktrees/feature-branch`
- Assign unique ports for the branch
- Configure environment files
- Install dependencies

### List Worktrees
```bash
./scripts/worktree-manager.sh list
```

### Switch to a Worktree
```bash
./scripts/worktree-manager.sh switch feature-branch
```

### Remove a Worktree
```bash
./scripts/worktree-manager.sh remove feature-branch
```

## tmux Session Management

The tmux integration provides a organized view of all running services.

### Start tmux Session
```bash
# Start all services in tmux
./scripts/tmux-dev.sh start

# Start specific version
./scripts/tmux-dev.sh start v1
```

### tmux Windows Layout
- **Window 0**: Observer (health monitoring)
- **Window 1**: API v1
- **Window 2**: API v2
- **Window 3**: API v3
- **Window 4**: Frontend v1
- **Window 5**: Frontend v2
- **Window 6**: Frontend v3
- **Window 7**: Shell

### tmux Commands
- `Ctrl+b` then `0-7`: Switch between windows
- `Ctrl+b` then `d`: Detach from session
- `Ctrl+b` then `[`: Enter scroll mode
- `Ctrl+b` then `c`: Create new window
- `Ctrl+b` then `x`: Close current pane

### Reattach to Session
```bash
./scripts/tmux-dev.sh attach
```

### Stop All Services
```bash
./scripts/tmux-dev.sh stop
```

## Environment Configuration

### API Configuration

Each API version has its own configuration in `api/v*/server.ts`:

```typescript
const config = getServerConfig('v1'); // Returns port 3001
```

### Frontend Configuration

Each frontend version has `.env.local`:

```env
# frontend/v1/.env.local
VITE_API_BASE=http://localhost:3001
VITE_API_VERSION=v1

# frontend/v2/.env.local
VITE_API_BASE=http://localhost:3002
VITE_API_VERSION=v2
```

## Development Workflow

### 1. Feature Development

When working on a new feature:

```bash
# Create a feature branch and worktree
git checkout -b feature-new-ui
./scripts/worktree-manager.sh create feature-new-ui

# Switch to the worktree
cd ../mas-worktrees/feature-new-ui

# Start development
pnpm dev:v2  # Work on v2
```

### 2. Testing Across Versions

Test backward compatibility:

```bash
# Start all versions
pnpm dev:all

# Test v1 frontend with v2 API
# Modify frontend/v1/.env.local temporarily
VITE_API_BASE=http://localhost:3002
```

### 3. A/B Testing

Run different versions side by side:

```bash
# Terminal 1: Start v1
pnpm dev:v1

# Terminal 2: Start v2
pnpm dev:v2

# Browser: Open both
# http://localhost:5173 (v1)
# http://localhost:5174 (v2)
```

## Available Scripts

### Root Package Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:all` | Start all versions |
| `pnpm dev:v1` | Start v1 (API + Frontend) |
| `pnpm dev:v2` | Start v2 (API + Frontend) |
| `pnpm dev:v3` | Start v3 (API + Frontend) |
| `pnpm dev:api:all` | Start all API versions |
| `pnpm dev:web:all` | Start all Frontend versions |
| `pnpm health` | Check service health |
| `pnpm stop:all` | Stop all services |

### Version-Specific Scripts

Each version directory has its own scripts:

```bash
# In api/v1/
pnpm dev    # Start API v1
pnpm test   # Run tests

# In frontend/v1/
pnpm dev    # Start Frontend v1
pnpm build  # Build for production
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find process using port
lsof -i:3001

# Kill process
kill -9 <PID>

# Or use the cleanup script
pnpm stop:all
```

### tmux Session Already Exists

```bash
# Kill existing session
tmux kill-session -t mas-dev

# Or restart
./scripts/tmux-dev.sh restart
```

### Worktree Issues

```bash
# List git worktrees
git worktree list

# Prune stale worktrees
git worktree prune

# Force remove worktree
git worktree remove --force ../mas-worktrees/branch-name
```

### Dependencies Issues

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear pnpm cache
pnpm store prune
```

## Best Practices

1. **Use tmux for Development**: The tmux integration provides the best overview of all services.

2. **One Version at a Time**: When making changes, focus on one version and then port changes to others.

3. **Test Cross-Version Compatibility**: Always test if v1 frontend works with v2 API, etc.

4. **Clean Shutdown**: Use `pnpm stop:all` or `tmux-dev.sh stop` for clean shutdown.

5. **Monitor Resources**: Use `pnpm health --watch` to monitor service health.

6. **Isolate Features**: Use git worktrees for feature branches to avoid conflicts.

## Migration from Single Version

If you have existing code in the old structure:

1. Your existing code is preserved in `api/server.ts` and `web/`
2. Version 1 directories contain copies of your current implementation
3. You can gradually migrate to the multi-version structure

## Contributing

When contributing to MAS:

1. Choose the appropriate version for your changes
2. Ensure backward compatibility when modifying shared core modules
3. Test your changes across all affected versions
4. Update version-specific documentation

## Support

For issues or questions:
- Check the [troubleshooting](#troubleshooting) section
- Review existing [issues](https://github.com/frexida/mas/issues)
- Create a new issue with version information