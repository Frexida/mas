# Design Document: Migrate to Isolated Sessions

## Architecture Overview

### Current State (Dual Mode)
```
MAS System
├── Legacy Mode
│   ├── Shared unit/ directory
│   ├── Shared workflows/ directory
│   ├── Fixed session name (mas-tmux)
│   └── Single session only
└── Isolated Mode
    ├── sessions/{uuid}/ directories
    ├── Per-session unit/ and workflows/
    ├── UUID-based session names
    └── Multiple concurrent sessions
```

### Target State (Unified)
```
MAS System
└── Isolated Sessions Only
    ├── sessions/{uuid}/ for ALL sessions
    ├── Each session has own workspace
    ├── UUID-based naming (mas-{uuid-prefix})
    └── Single or multiple sessions supported
```

## Key Design Decisions

### 1. Complete Legacy Removal
**Decision**: Remove all legacy mode code paths entirely.

**Rationale**:
- Eliminates code complexity and maintenance burden
- Ensures consistent behavior across all scenarios
- Simplifies testing and debugging

**Impact**:
- All `sessionMode` checks removed
- Legacy fallback logic deleted
- Single code path for session creation

### 2. Default Session Handling
**Decision**: Even single-user scenarios use isolated session architecture.

**Rationale**:
- Consistency across all use cases
- No special cases to handle
- Clean workspace isolation always

**Implementation**:
- Remove `SESSION_NAME="mas-tmux"` default
- Always generate UUID for session ID
- Always create `sessions/{uuid}/` directory

### 3. API Simplification
**Decision**: Remove `sessionMode` from API completely.

**Before**:
```json
POST /runs
{
  "sessionMode": "isolated|legacy",
  "agents": { ... }
}
```

**After**:
```json
POST /runs
{
  "agents": { ... }
}
```

**Response** (always includes session workspace info):
```json
{
  "sessionId": "uuid",
  "tmuxSession": "mas-{uuid-prefix}",
  "workingDir": "/path/to/sessions/{uuid}",
  "unitDir": "/path/to/sessions/{uuid}/unit",
  "workflowsDir": "/path/to/sessions/{uuid}/workflows"
}
```

### 4. Session Discovery
**Decision**: Single source of truth via sessions.index.

**Rationale**:
- No need to distinguish between legacy and isolated
- All sessions tracked uniformly
- Simplified lookup logic

**Implementation**:
```typescript
// Before
if (isIsolatedSession) {
  // Check sessions.index
} else {
  // Check .mas_session file
}

// After
// Always check sessions.index
```

### 5. Migration Path
**Decision**: Clean break with warning messages for legacy attempts.

**Approach**:
1. Detect `mas-tmux` session if exists
2. Show migration message
3. Prevent new legacy session creation
4. Always create isolated session

**Message**:
```
Legacy session mode has been deprecated.
Creating new isolated session instead.
Session ID: {uuid}
Workspace: sessions/{uuid}/
```

## Component Changes

### mas_refactored.sh
```bash
# Remove
SESSION_NAME="mas-tmux"  # Default removed
MAS_SESSION_MODE check    # Mode detection removed

# Simplify to
SESSION_ID=$(generate_uuid)
SESSION_NAME="mas-${SESSION_ID:0:8}"
create_session_workspace "$SESSION_ID"
```

### API Routes (runs.ts)
```typescript
// Remove
sessionMode?: 'legacy' | 'isolated'

// Always use
const sessionId = generateSessionId();
const sessionDir = path.join(MAS_ROOT, 'sessions', sessionId);
// Create workspace and proceed
```

### Session Manager (session-manager.ts)
```typescript
// Remove dual-mode logic
getAllSessions() {
  // Only read from sessions.index
  // No legacy session detection
  // No mode field needed
}
```

### WebUI
- Remove mode display
- Simplify session list rendering
- Remove legacy-specific UI elements

## File Structure (Final)

```
mas/
├── sessions/              # All sessions here
│   ├── {uuid-1}/         # Every session isolated
│   ├── {uuid-2}/
│   └── .sessions.index   # Single registry
├── unit/                  # Templates only
├── workflows/             # Templates only
├── lib/                   # Simplified libraries
└── api/                   # Simplified API
```

## Removed Components

### Files/Functions to Remove
1. `readSessionFile()` - Legacy .mas_session reader
2. `sessionMode` validation in API
3. `MAS_SESSION_MODE` environment variable
4. Legacy mode checks in mas_refactored.sh
5. Dual-mode logic in session-manager.ts

### Deprecated Configurations
- `.mas_session` file (replaced by sessions.index)
- `SESSION_NAME="mas-tmux"` default
- Project mode session naming logic

## Testing Strategy

### Unit Tests
- Remove legacy mode tests
- Ensure all tests use isolated sessions
- Verify UUID generation for all cases

### Integration Tests
- Test session creation always produces isolated session
- Verify workspace directories always created
- Confirm sessions.index is single source of truth

### Migration Tests
- Warning message when `mas-tmux` detected
- Proper UUID session creation after warning
- No legacy session creation possible

## Performance Implications

### Improvements
- Reduced code paths = faster execution
- Single session lookup mechanism
- No mode detection overhead

### Considerations
- Slightly more disk usage (always create workspace)
- Acceptable trade-off for consistency

## Security Considerations

### Benefits
- Always isolated = better security
- No shared workspace vulnerabilities
- Consistent permission model

## Rollback Plan

If critical issues arise:
1. Keep backup of legacy code (git history)
2. Emergency patch to restore dual-mode
3. But strong commitment to move forward

## Future Enhancements

With unified architecture, easier to add:
- Session templates
- Session cloning
- Session migration between hosts
- Session archiving and restore
- Resource limits per session