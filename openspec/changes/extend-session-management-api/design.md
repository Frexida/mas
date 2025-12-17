# Design: Extend Session Management API

## Architecture Overview

### System Components
```
┌─────────────┐     HTTP      ┌──────────────┐     Shell      ┌─────────────┐
│   UI Client │──────────────▶│  Hono API    │───────────────▶│    tmux     │
│   (React)   │◀──────────────│   Server     │◀───────────────│  Sessions   │
└─────────────┘     JSON      └──────────────┘     Output     └─────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  Filesystem  │
                              │ (.mas_session)│
                              └──────────────┘
```

### Data Flow

1. **Session List Request**
   - UI sends GET /sessions
   - API executes `tmux list-sessions`
   - Parses tmux output and enriches with filesystem data
   - Returns structured JSON response

2. **Session Detail Request**
   - UI sends GET /sessions/:sessionId
   - API reads `.mas_session` file
   - Queries tmux for real-time status
   - Combines data and returns detailed info

3. **Session Connect Request**
   - UI sends POST /sessions/:sessionId/connect
   - API validates session exists
   - Updates session metadata
   - Returns connection parameters

## API Design

### Endpoint Specifications

#### 1. GET /sessions
```yaml
responses:
  200:
    content:
      application/json:
        schema:
          type: array
          items:
            $ref: '#/components/schemas/SessionInfo'
```

#### 2. GET /sessions/:sessionId
```yaml
parameters:
  - name: sessionId
    in: path
    required: true
    schema:
      type: string
      format: uuid
responses:
  200:
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/SessionDetail'
  404:
    description: Session not found
```

#### 3. POST /sessions/:sessionId/connect
```yaml
parameters:
  - name: sessionId
    in: path
    required: true
    schema:
      type: string
      format: uuid
responses:
  200:
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ConnectionInfo'
  404:
    description: Session not found
```

### Data Schemas

```typescript
interface SessionInfo {
  sessionId: string;        // UUID
  tmuxSession: string;      // mas-XXXXXXXX
  status: 'active' | 'inactive' | 'terminated';
  workingDir: string;
  startedAt: string;        // ISO8601
  agentCount: number;
  httpServerStatus: 'running' | 'stopped';
}

interface SessionDetail extends SessionInfo {
  agents: AgentStatus[];
  windows: WindowInfo[];
  lastActivity?: string;    // ISO8601
  config?: AgentConfig;     // Original configuration
}

interface ConnectionInfo {
  sessionId: string;
  tmuxSession: string;
  attachCommand: string;    // tmux attach command
  status: 'connected' | 'failed';
  timestamp: string;
}
```

## Implementation Strategy

### Phase 1: OpenAPI Specification
- Update openapi.yaml with new endpoints
- Define schemas for request/response
- Add examples and documentation

### Phase 2: Backend Implementation
1. Create /api/routes/sessions.ts
2. Implement tmux command wrappers
3. Add session metadata management
4. Create validation schemas

### Phase 3: Integration
- Test with existing UI components
- Ensure backward compatibility
- Update documentation

## Technical Considerations

### Session Identification
- Primary key: sessionId (UUID)
- Secondary key: tmuxSession name (mas-XXXXXXXX)
- Mapping stored in .mas_session files

### Status Detection
```bash
# Active: tmux session exists and has active panes
tmux list-sessions -F "#{session_name}" | grep "^mas-"

# Agent status: Check pane processes
tmux list-panes -t SESSION -F "#{pane_pid}"
```

### Error Handling
- 404: Session not found in tmux or filesystem
- 409: Session already connected/in use
- 500: tmux command failure

### Performance Optimization
- Cache session list for 5 seconds
- Batch tmux commands when possible
- Use streaming for large responses

## Security Considerations
- Validate UUID format for sessionId
- Sanitize tmux command inputs
- Limit session list to mas-* prefix
- No direct command execution from client

## Testing Strategy
- Unit tests for tmux output parsing
- Integration tests with real tmux sessions
- E2E tests with UI client
- Performance tests with multiple sessions