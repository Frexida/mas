# Design: Session-Aware Message API

## Architecture Overview

The enhancement introduces session awareness to the message routing system while maintaining backward compatibility.

```
Client (WebUI) → API Server → Message Router → tmux Session
      ↓              ↓                            ↑
   [session]    [validate]                   [specific session]
```

## Component Design

### API Layer
```typescript
// Request Schema
interface MessageRequest {
  target: string;      // Agent ID or group
  message: string;     // Message content
  execute?: boolean;   // Execute immediately
  session: string;     // Required: specific tmux session ID (e.g., "mas-fd5dfb9b")
}
```

### Session Resolution Logic
1. Validate provided `session` parameter exists
2. Use the exact session ID provided
3. Return error if session not found (no fallback)

### WebUI Session Management
```javascript
// Session Information Storage
// After successful session creation, store:
sessionInfo = {
  sessionId: "fd5dfb9b-7c4d-4309-ab68-1971f275ff86",
  tmuxSession: "mas-fd5dfb9b",
  workingDir: "/home/mtdnot/dev/anag/mas/sessions/...",
  startedAt: "2025/12/18 11:26:19"
}

// Include in all message requests:
messageRequest.session = sessionInfo.tmuxSession;
```

## Data Flow

1. **Session Creation and Storage**
   ```
   POST /sessions → Response includes:
   {
     sessionId: "fd5dfb9b-7c4d-4309-ab68-1971f275ff86",
     tmuxSession: "mas-fd5dfb9b",
     workingDir: "...",
     startedAt: "..."
   }
   → Store in WebUI state
   ```

2. **Message with Required Session**
   ```
   POST /message
   {
     target: "10",
     message: "Hello",
     session: "mas-fd5dfb9b"  // Required, from stored state
   }
   ```

3. **Backend Processing**
   - Validate session exists
   - Set MAS_SESSION_NAME environment variable
   - Execute mas_refactored.sh with session context

## Error Handling

| Error Case | Response | User Action |
|------------|----------|-------------|
| Invalid session ID | 400 Bad Request | Select valid session |
| Session disconnected | 410 Gone | Refresh session list |
| No sessions available | 503 Service Unavailable | Start MAS session |

## Security Considerations
- Session IDs are validated against actual tmux sessions
- No direct shell command injection possible
- Session access follows system user permissions

## Performance Impact
- Minimal: one additional tmux query per request
- Session list cached for 5 seconds in WebUI
- No persistent connections required