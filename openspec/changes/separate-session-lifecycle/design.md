# Design Document: Session Lifecycle Separation

## Architecture Overview

### Current Architecture (Problematic)
```
User → CLI (mas start) → Creates Session + Starts Agents + Optionally Starts API/WebUI
         ↓
WebUI → API (/runs) → Calls CLI (mas start --config) → Creates Duplicate Session
```

### Proposed Architecture (Clean Separation)
```
Infrastructure Layer:
User → CLI (mas start) → Starts API + WebUI only

Session Management Layer (Option A - via CLI):
User → CLI (mas session create) → Creates Session + Starts Agents

Session Management Layer (Option B - via WebUI):
User → WebUI → API (/runs) → Direct Session Creation (no CLI dependency)
```

## Component Responsibilities

### mas CLI
- `mas start`: Launch infrastructure services (API + WebUI)
- `mas stop`: Shutdown infrastructure services
- `mas session create [--config]`: Create new session with agents
- `mas session list`: List active sessions
- `mas session stop <id>`: Terminate specific session
- `mas session attach <id>`: Attach to tmux session
- `mas send`: Send messages to agents (unchanged)

### API Server
- `/runs`: Create sessions directly using Node.js child_process
- `/sessions`: List and manage sessions
- `/message`: Send messages to agents (unchanged)
- No dependency on CLI commands for core functionality

### WebUI
- Primary interface for session lifecycle management
- Can create, list, stop, and monitor sessions
- Communicates only via API endpoints

## Key Design Decisions

### 1. Direct tmux Management from API
Instead of shelling out to `mas start`, the API will:
- Use `child_process.spawn()` to create tmux sessions
- Maintain session state in memory or lightweight database
- Handle cleanup on process termination

### 2. Session ID Generation
- Generate UUIDs in API layer
- Pass to tmux as session names (mas-<uuid-prefix>)
- Use for tracking and correlation

### 3. Configuration Handling
- API accepts agent configuration JSON
- Transforms to tmux commands internally
- No intermediate shell script generation

### 4. State Management
- Track session states: creating, active, stopping, terminated
- Implement proper state transitions
- Handle orphaned sessions on API restart

## Migration Strategy

### Phase 1: Parallel Implementation
- Keep existing `mas start` behavior temporarily
- Add deprecation warnings
- Implement new `mas session` command alongside

### Phase 2: Default Switch
- Make `mas start` infrastructure-only by default
- Add `--legacy` flag for old behavior
- Update documentation to prefer new approach

### Phase 3: Legacy Removal
- Remove old session creation from `mas start`
- Remove `--legacy` flag
- Clean up deprecated code paths

## Error Handling

### Session Creation Failures
- Rollback partially created resources
- Provide detailed error messages
- Log failures for debugging

### Orphaned Sessions
- Detect on API startup
- Offer cleanup or adoption options
- Prevent resource leaks

## Performance Considerations
- Session creation should complete in <5 seconds
- Support concurrent session creation
- Implement session pooling for quick startup
- Lazy load agent configurations