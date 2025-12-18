# Tasks: Extend Session Management API

## Phase 1: OpenAPI Specification Update (Day 1)

- [ ] Merge openapi-extension.yaml into main openapi.yaml
- [ ] Add Sessions tag to the main tags list
- [ ] Update API version to 2.1.0
- [ ] Generate updated API documentation
- [ ] Validate OpenAPI spec with online validator

## Phase 2: Backend Data Models (Day 1-2)

- [ ] Create /api/types/session.ts with TypeScript interfaces
  - [ ] SessionInfo interface
  - [ ] SessionDetail interface
  - [ ] AgentStatus interface
  - [ ] WindowInfo interface
  - [ ] ConnectionInfo interface

- [ ] Create /api/validators/sessions.ts with Zod schemas
  - [ ] SessionListQuerySchema for GET /sessions query params
  - [ ] ConnectRequestSchema for POST /connect body
  - [ ] SessionIdParamSchema for path parameter validation
  - [ ] Response schemas for each endpoint

## Phase 3: Tmux Integration Layer (Day 2)

- [ ] Create /api/utils/tmux.ts for tmux command wrappers
  - [ ] listTmuxSessions() - Parse tmux list-sessions output
  - [ ] getSessionWindows() - Get window information
  - [ ] getSessionPanes() - Get pane information
  - [ ] checkSessionExists() - Validate session existence

- [ ] Create /api/utils/session-manager.ts
  - [ ] readSessionFile() - Read .mas_session metadata
  - [ ] getSessionStatus() - Determine active/inactive status
  - [ ] enrichSessionData() - Combine tmux and file data

## Phase 4: API Routes Implementation (Day 2-3)

- [ ] Create /api/routes/sessions.ts
  - [ ] GET / - List all sessions endpoint
  - [ ] GET /:sessionId - Get session details endpoint
  - [ ] POST /:sessionId/connect - Connect to session endpoint
  - [ ] POST /:sessionId/stop - Stop session endpoint

- [ ] Update /api/server.ts
  - [ ] Import and mount sessions route
  - [ ] Add route at /sessions path

## Phase 5: Testing (Day 3)

- [ ] Create /tests/test_sessions_api.sh
  - [ ] Test GET /sessions with various filters
  - [ ] Test GET /sessions/:id with valid/invalid IDs
  - [ ] Test POST /connect with existing session
  - [ ] Test error cases (404, 500)

- [ ] Manual testing with UI
  - [ ] Verify session list displays correctly
  - [ ] Test session selection and connection
  - [ ] Verify auto-refresh functionality
  - [ ] Test error handling in UI

## Phase 6: Documentation (Day 3-4)

- [ ] Update README.md with new endpoints
- [ ] Create /docs/SESSION_MANAGEMENT.md
  - [ ] API endpoint documentation
  - [ ] Usage examples
  - [ ] Architecture overview
  - [ ] Troubleshooting guide

- [ ] Update postman/insomnia collection
- [ ] Add curl examples to documentation

## Phase 7: Integration & Deployment (Day 4)

- [ ] Test with existing UI components
- [ ] Verify backward compatibility with /runs and /status
- [ ] Update CI/CD pipeline if needed
- [ ] Deploy to staging environment
- [ ] Performance testing with multiple sessions

## Validation Checklist

- [ ] All TypeScript files compile without errors
- [ ] OpenAPI spec validates successfully
- [ ] All endpoints return correct status codes
- [ ] Session list matches actual tmux sessions
- [ ] Connection to existing session works
- [ ] Error messages are user-friendly
- [ ] API responses match UI expectations
- [ ] Performance is acceptable (<200ms response time)

## Dependencies

- Requires tmux to be installed and accessible
- Depends on existing .mas_session file format
- Must maintain compatibility with mas_refactored.sh

## Risk Mitigation

- [ ] Add timeout to tmux commands (5 seconds)
- [ ] Implement retry logic for transient failures
- [ ] Add circuit breaker for tmux command failures
- [ ] Cache session list to reduce tmux calls
- [ ] Validate all user inputs to prevent command injection

## Success Metrics

- Session list loads in <500ms
- Zero breaking changes to existing endpoints
- 100% of UI requirements met
- All tests passing (unit, integration, E2E)
- API documentation complete and accurate