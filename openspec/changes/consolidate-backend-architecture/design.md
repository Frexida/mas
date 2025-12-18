# Backend Architecture Design

## Current Architecture

### Layered Messaging System
```
┌─────────────────────────────────────────┐
│          External Interfaces            │
│     (WebUI, CLI, External Tools)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           API Layer (Hono)              │
│   - REST endpoints                      │
│   - Session validation                  │
│   - Request/Response handling           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Command Layer (mas send)           │
│   - Target resolution                   │
│   - Session management                  │
│   - Message routing                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Distribution Layer (tmux)          │
│   - Physical message delivery           │
│   - Window/Pane management              │
│   - Agent process management            │
└─────────────────────────────────────────┘
```

## File Organization Strategy

### Keep and Document
```
mas/
├── api/                     # Hono API server
│   ├── server.ts           # Main server entry
│   ├── routes/             # API endpoints
│   ├── validators/         # Request validation
│   └── README.md           # API documentation
├── lib/                    # Shell script modules
│   ├── agent.sh           # Agent management
│   ├── message.sh         # Message routing
│   ├── session.sh         # Session management
│   └── tmux.sh            # tmux operations
├── docs/                   # Consolidated documentation
│   ├── API.md             # API specification
│   ├── ARCHITECTURE.md    # System architecture
│   └── SHELL_MODULES.md   # Shell script documentation
└── README.md              # Project overview
```

### Remove (Legacy/Unused)
- `apache-proxy.conf` - Apache reverse proxy config (replaced by direct API)
- `deploy-to-apache.sh` - Apache deployment script
- `mas-api.service` - systemd service file
- `fix-permissions.sh` - Permission fix script
- `api-docs.html`, `api-redoc.html` - Old API documentation
- `openapi.yaml`, `openapi.yaml.backup` - OpenAPI specifications
- `serve_docs.py` - Documentation server
- `buildspec.yml` - AWS CodeBuild config
- `CI_CD_GUIDE.md` - CI/CD documentation
- `mas.sh.backup` - Backup of old implementation
- `http_server_fixed.js` - Old HTTP server
- `HTTP_SERVER_SETUP.md`, `ISOLATED_SESSIONS.md` - Outdated docs

### Update References
- `install.sh` - Update to reference `mas_refactored.sh` instead of `mas.sh`
- `init_unit.sh` - Update documentation to reference current implementation
- After updates, remove:
  - `mas.sh` - Old implementation (after install.sh is updated)
  - `send_message.sh` - Old message sending script (verify not used first)

## API Documentation Structure

### Endpoints
1. **GET /health** - Health check
2. **GET /sessions** - List active sessions
3. **POST /message** - Send message to agents
4. **POST /runs** - Create new session (if implemented)

### Message Flow
1. WebUI/External → API POST /message
2. API validates session exists
3. API calls `mas send` with MAS_SESSION_NAME env
4. `mas send` routes through shell modules
5. tmux delivers to target agent(s)

## Design Principles
1. **Layered Architecture**: Each layer has specific responsibilities
2. **Single Source of Truth**: `mas send` handles all message routing logic
3. **API as Proxy**: API layer validates and forwards, doesn't implement routing
4. **Session Isolation**: Each session operates independently
5. **Backward Compatibility**: Maintain existing CLI interfaces

## OSS Naming Conventions

### Project Identity
- **Project Name**: MAS (Multi-Agent System)
- **Package Name**: `@mas/core` (if published to npm)
- **Command Name**: `mas` (short, memorable, unique)
- **Repository**: `mas` or `mas-system` (clear, searchable)

### File Naming Standards
```
mas/
├── mas                     # Main CLI entry point (no extension for executables)
├── mas-core.sh            # Core implementation (replace mas_refactored.sh)
├── lib/
│   ├── mas-agent.sh       # Agent management module
│   ├── mas-message.sh     # Message routing module
│   ├── mas-session.sh     # Session management module
│   └── mas-tmux.sh        # tmux operations module
├── scripts/
│   ├── install.sh         # Standard installation script
│   └── init.sh            # Initialization script
└── api/
    ├── server.ts          # API server entry point
    └── routes/
        ├── health.ts      # Health check endpoint
        ├── sessions.ts    # Session management endpoints
        └── messages.ts    # Message handling endpoints
```

### API Naming Conventions
- **Base URL**: `/api/v1/` (versioned API)
- **Endpoints**:
  - `GET  /api/v1/health` - Health check
  - `GET  /api/v1/sessions` - List sessions
  - `POST /api/v1/sessions` - Create session
  - `DELETE /api/v1/sessions/:id` - Stop session
  - `POST /api/v1/messages` - Send message
  - `GET  /api/v1/agents` - List agents

### Environment Variables
- `MAS_HOME` - Installation directory
- `MAS_CONFIG_DIR` - Configuration directory
- `MAS_SESSION_NAME` - Current session name
- `MAS_API_PORT` - API server port
- `MAS_API_HOST` - API server host
- `MAS_LOG_LEVEL` - Logging level

### Configuration Files
- `.masrc` - Project-level configuration
- `~/.config/mas/config.yml` - User configuration
- `.mas/` - Project metadata directory

### Naming Rationale
1. **Consistency**: All MAS-related files use `mas-` prefix
2. **Clarity**: Descriptive names that indicate purpose
3. **Standards**: Follow Unix/Linux conventions
4. **Searchability**: Easy to find in package managers and GitHub
5. **Professionalism**: Clean, enterprise-ready naming