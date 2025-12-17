# Design Document: API Alignment

## Architecture Overview

### Current Architecture
```
UI Components → api.ts → /api/agents/configure → Response (files)
```

### Target Architecture
```
UI Components → masApi.ts → /runs → Response (session info)
                         ↓
                    /message → Tmux communication
```

## Key Design Decisions

### 1. API Service Restructure
- Create new `masApi.ts` service to replace `api.ts`
- Implement separate functions for `/runs` and `/message` endpoints
- Maintain backward compatibility during transition

### 2. Type System Updates
```typescript
// New types aligned with OpenAPI
interface Agent {
  id: string;  // Pattern: "\\d{2}"
  prompt: string;  // 1-5000 chars
}

interface Unit {
  unitId: number;  // 1-4
  manager: Agent;
  workers: Agent[];  // 1-5 items
}

interface RunsRequest {
  agents: {
    metaManager?: Agent;
    units: Unit[];  // 1-4 items
  };
}

interface RunsResponse {
  sessionId: string;  // UUID
  tmuxSession: string;
  workingDir: string;
  startedAt: string;  // ISO 8601
}
```

### 3. URL Configuration
- Change default from `tmp.frexida.com` to `mas-api.frexida.com`
- Update preset options to include correct production URL
- Implement URL validation to ensure proper protocol

### 4. Response Display Updates
- Replace file display component with session info display
- Show sessionId, tmuxSession, workingDir prominently
- Add copy-to-clipboard for session identifiers

### 5. Error Handling
- Implement proper 400/500 error response handling
- Display error codes and messages from API
- Add retry logic with exponential backoff

## Migration Strategy

### Phase 1: Type System
- Create new type definitions matching OpenAPI spec
- Keep old types temporarily for compatibility

### Phase 2: API Service
- Implement new masApi service alongside existing
- Add feature flag to switch between implementations

### Phase 3: UI Components
- Update components to use new types
- Modify response display for session info

### Phase 4: Cleanup
- Remove old api.ts service
- Delete deprecated type definitions
- Update all imports and references

## Trade-offs

### Pros
- Correct API integration with official specification
- Better error handling and validation
- Support for tmux session management
- Future-proof for API extensions

### Cons
- Breaking change for existing users
- Requires complete retest of API integration
- LocalStorage data becomes invalid
- No backward compatibility with old endpoint

## Risk Mitigation
- Provide clear migration guide for users
- Auto-detect and reset invalid LocalStorage data
- Implement comprehensive error messages
- Add API health check on startup