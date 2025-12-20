# Design Document: Session Restore API

## Architecture Overview

The session restore API builds upon the existing session management infrastructure, adding restoration capabilities through a new endpoint that bridges the Node.js API layer with the bash-based restoration logic.

```
Web UI / API Client
        |
        v
[POST /sessions/:id/restore]
        |
        v
session-manager.ts::restoreSession()
        |
        v
restore-wrapper.ts::executeRestore()
        |
        v
lib/session-restore.sh::restore_session()
        |
        v
tmux session creation
```

## Component Interactions

### API Layer (TypeScript/Node.js)
- **Route Handler**: Validates request, checks permissions, handles HTTP concerns
- **Session Manager**: Business logic, state validation, index management
- **Restore Wrapper**: Shell script integration, process management

### Shell Layer (Bash)
- **session-restore.sh**: Tmux session creation, window/pane setup, environment configuration
- **Return Values**: Structured output for API consumption (exit codes, JSON responses)

## State Management

### Session States
```
terminated -> restoring -> inactive/active
     ^            |
     |____________| (on failure)
```

### Concurrent Access Control
- Use file-based locking on session directory
- Atomic updates to session index using temp file + rename
- Check for existing tmux session before restoration

## Error Handling Strategy

### API Level Errors
- **400 Bad Request**: Invalid session state (not terminated)
- **404 Not Found**: Session doesn't exist
- **409 Conflict**: Restoration already in progress
- **500 Internal Server Error**: Shell script execution failure

### Shell Level Errors
- Exit codes mapped to specific error types
- Stderr captured for detailed error messages
- Rollback on partial failure (cleanup tmux session)

## Data Flow

### Restoration Request Flow
1. Client sends POST request with optional `startAgents` flag
2. API validates session exists and is terminated
3. API marks session as "restoring" in index
4. Shell script creates tmux session structure
5. On success: Update index to "inactive", return session details
6. On failure: Rollback to "terminated", return error details

### Session Index Updates
```typescript
// Atomic update pattern
const tempFile = `${indexPath}.tmp`;
writeFileSync(tempFile, JSON.stringify(updatedIndex));
renameSync(tempFile, indexPath);
```

## Security Considerations

- **Path Validation**: Sanitize session IDs to prevent path traversal
- **Command Injection**: Use array-based command execution, not string concatenation
- **Resource Limits**: Implement restoration rate limiting per client
- **Permissions**: Verify user has access to restore specific sessions

## Performance Implications

- **Restoration Time**: ~1-2 seconds for full 6-window session
- **Index Updates**: Milliseconds (file-based, atomic)
- **Concurrent Requests**: Sequential processing per session, parallel across sessions

## Alternative Approaches Considered

### Pure TypeScript Implementation
- **Pros**: No shell dependency, easier testing
- **Cons**: Complex tmux interaction, duplicated logic
- **Decision**: Rejected - reuse existing, tested shell implementation

### Direct tmux Library Integration
- **Pros**: Type safety, better error handling
- **Cons**: Limited Node.js tmux libraries, learning curve
- **Decision**: Rejected - shell script is proven and maintainable

### Database-backed Session Index
- **Pros**: Better concurrency, ACID properties
- **Cons**: Additional dependency, migration complexity
- **Decision**: Deferred - current file-based approach sufficient for now

## Future Enhancements

1. **Progress Reporting**: WebSocket/SSE for real-time restoration status
2. **Batch Restoration**: Restore multiple sessions in single request
3. **Session Templates**: Restore with modified configuration
4. **Restoration Scheduling**: Queue restoration for resource management
5. **Audit Logging**: Track who restored which sessions when

## Testing Strategy

### Unit Tests
- Mock shell command execution
- Test state validation logic
- Verify error handling paths

### Integration Tests
- Create and terminate test session
- Restore via API
- Verify tmux session exists with correct structure

### End-to-End Tests
- Full flow from UI to tmux session
- Test concurrent restoration attempts
- Verify rollback on failure