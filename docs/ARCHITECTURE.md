# MAS System Architecture

## Overview

The Multi-Agent System (MAS) is a layered architecture system that manages multiple AI agents through tmux sessions. It provides both CLI and API interfaces for controlling agent communication and coordination.

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    External Interfaces                    │
│         WebUI | CLI Tools | External Applications         │
└────────────────────────┬─────────────────────────────────┘
                         │
                    HTTP/REST API
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    API Layer (Hono)                       │
│  • Request validation (Zod schemas)                       │
│  • Session verification                                   │
│  • Response formatting                                    │
│  • Error handling                                         │
└────────────────────────┬─────────────────────────────────┘
                         │
                 MAS_SESSION_NAME env
                         │
┌────────────────────────▼─────────────────────────────────┐
│               Command Layer (mas send)                    │
│  • Session detection/selection                            │
│  • Target resolution (agent/unit/group)                   │
│  • Message routing logic                                  │
│  • Execute flag handling                                  │
└────────────────────────┬─────────────────────────────────┘
                         │
                   Shell modules
                         │
┌────────────────────────▼─────────────────────────────────┐
│            Distribution Layer (tmux)                      │
│  • Physical message delivery                              │
│  • Window/pane management                                 │
│  • Process management                                     │
│  • Session isolation                                      │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    Agent Layer                            │
│  • 13 AI agents (Claude)                                  │
│  • 4 units (Meta, Design, Development, Business)          │
│  • Hierarchical structure (managers + workers)            │
└──────────────────────────────────────────────────────────┘
```

## Component Details

### 1. API Layer

**Technology:** Node.js + Hono framework

**Responsibilities:**
- Accept HTTP requests from external clients
- Validate request parameters using Zod schemas
- Verify tmux session existence
- Forward commands to shell layer
- Return structured JSON responses

**Key Files:**
- `api/server.ts` - Main server entry
- `api/routes/message.ts` - Message endpoint
- `api/validators/message.ts` - Request validation

### 2. Command Layer

**Technology:** Bash shell scripts

**Responsibilities:**
- Detect current tmux session (if running in tmux)
- Resolve target agents/units/groups
- Route messages to appropriate destinations
- Handle execution flags (with/without Enter key)

**Key Files:**
- `mas` (symlink) → `mas_refactored.sh` - Main CLI entry
- Core commands: start, send, stop, attach, status

### 3. Shell Modules Layer

**Technology:** Modular bash scripts

**Responsibilities:**
- Agent lifecycle management
- Message routing algorithms
- Session persistence
- tmux operations abstraction

**Key Modules:**
- `lib/agent.sh` - Agent management
- `lib/message.sh` - Message routing
- `lib/session.sh` - Session management
- `lib/tmux.sh` - tmux operations

### 4. Distribution Layer

**Technology:** tmux (terminal multiplexer)

**Responsibilities:**
- Create isolated terminal sessions
- Manage windows and panes
- Deliver keystrokes to agents
- Maintain session state

**Structure:**
```
Session: mas-[uuid]
├── Window 0: meta (1 pane)
│   └── Agent 00: Meta Manager
├── Window 1: design (4 panes)
│   ├── Agent 10: Design Manager
│   ├── Agent 11: UI Designer
│   ├── Agent 12: UX Designer
│   └── Agent 13: Visual Designer
├── Window 2: development (4 panes)
│   ├── Agent 20: Development Manager
│   ├── Agent 21: Frontend Developer
│   ├── Agent 22: Backend Developer
│   └── Agent 23: DevOps
└── Window 3: business (4 panes)
    ├── Agent 30: Business Manager
    ├── Agent 31: Accounting
    ├── Agent 32: Strategy
    └── Agent 33: Analytics
```

### 5. Agent Layer

**Technology:** Claude AI (via clauded CLI)

**Agent Types:**
- **Managers** (Opus model): Strategic decisions, coordination
- **Workers** (Sonnet model): Task execution, specialized work

**Communication Flow:**
1. Agents receive messages via tmux
2. Process using their AI model
3. Can send messages to other agents using `mas send`
4. Coordinate within and across units

## Design Principles

### 1. Layered Architecture
Each layer has specific responsibilities and communicates only with adjacent layers.

### 2. Single Source of Truth
The `mas send` command is the only component that implements message routing logic.

### 3. API as Proxy
The API layer validates and forwards but doesn't implement business logic.

### 4. Session Isolation
Each MAS session operates independently with its own tmux session and workspace.

### 5. Modular Design
Shell scripts are organized into reusable modules with clear interfaces.

### 6. Convention over Configuration
Consistent naming and structure reduce configuration needs.

## Message Flow Example

```
1. WebUI sends POST /message
   {
     "target": "11",
     "message": "Design the login page",
     "session": "mas-a85df580",
     "execute": true
   }

2. API validates request
   - Check session exists
   - Validate required fields
   - Set MAS_SESSION_NAME env

3. API executes: mas send "11" "Design the login page" -e

4. mas send:
   - Detects/uses session mas-a85df580
   - Resolves target 11 → design window, pane 1
   - Routes through lib/message.sh

5. lib/message.sh:
   - Calls send_to_agent function
   - Maps to window.pane coordinates

6. tmux delivers:
   - send-keys to mas-a85df580:design.1
   - Includes Enter key (execute=true)

7. Agent 11 receives:
   - Sees message in terminal
   - Processes with Claude AI
   - Can respond or take action
```

## Session Management

### Session Lifecycle

1. **Creation:** `mas start`
   - Generates UUID-based session ID
   - Creates tmux session
   - Initializes windows/panes
   - Starts agents with clauded

2. **Operation:** Active session
   - Agents process messages
   - Inter-agent communication
   - External API access

3. **Termination:** `mas stop`
   - Stops all agents
   - Kills tmux session
   - Cleans up resources

### Session Priority

When determining which session to use:

1. **Current tmux session** (if running in tmux)
2. **MAS_SESSION_NAME** environment variable
3. **find_active_session** (attached or first found)

## Security Considerations

### Current Implementation
- No authentication on API
- Local-only deployment assumed
- Shell command injection prevention via escaping

### Production Recommendations
- Add API authentication (JWT, API keys)
- Implement rate limiting
- Use HTTPS/TLS
- Restrict CORS origins
- Run in containerized environment
- Implement audit logging

## Scalability

### Current Limitations
- Single-machine deployment
- 13 agents per session
- Synchronous message delivery

### Future Enhancements
- Distributed agent deployment
- Message queue integration
- Async message handling
- Dynamic agent scaling
- Multi-session orchestration

## Monitoring and Debugging

### Logging
- API logs: `.mas_api.log`
- Session info: `.mas_session`
- Agent output: Via tmux panes

### Debugging Commands
```bash
# View all sessions
tmux ls

# Attach to session
mas attach

# View specific agent
mas attach -w design  # Attach to design window

# Check API health
curl http://localhost:8765/health

# Monitor API logs
tail -f .mas_api.log
```

## Configuration

### Environment Variables
- `MAS_SESSION_NAME` - Override session detection
- `MAS_API_PORT` - API server port (default: 8765)
- `MAS_API_HOST` - API server host (default: 0.0.0.0)
- `MAS_LOG_LEVEL` - Logging verbosity

### Project Configuration
- `.masrc` - Project-level settings
- `unit/*/` - Agent workspaces
- `workflows/` - Agent behavior definitions