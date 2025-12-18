# Implementation Tasks

## Phase 1: API Enhancement (Backend)
- [x] Update MessageRequestSchema in `api/validators/message.ts` to include required `session` field
- [x] Modify `api/routes/message.ts` to require and validate session parameter
- [x] Add session validation logic to check if session exists
- [x] Return 400 error when session is missing
- [x] Update error responses for invalid sessions
- [x] Add session info to response payload for confirmation

## Phase 2: Session Management (Backend)
- [x] Remove auto-detection logic from message handler
- [x] Simplify session routing to use only provided session
- [x] Implement proper error codes (400 for missing, 404 for invalid)
- [x] Add logging for session-specific routing

## Phase 3: WebUI Session Storage (Frontend)
- [ ] Store session info from session creation response
- [ ] Extract and save tmux session ID (mas-fd5dfb9b format)
- [ ] Display current session information in UI
- [ ] Include stored session ID in all message API requests
- [ ] Add error handling when no session is available
- [ ] Prevent message sending without valid session

## Phase 4: Testing & Validation
- [x] Test required session parameter validation
- [x] Test invalid session ID handling
- [ ] Test session information storage in WebUI
- [ ] Test message sending with stored session
- [x] Verify error messages are clear when session is missing

## Phase 5: Documentation
- [ ] Update API documentation with new session parameter
- [ ] Document session resolution logic
- [ ] Add WebUI usage examples
- [ ] Update troubleshooting guide for session issues

## Dependencies
- Phase 2 depends on Phase 1
- Phase 3 depends on understanding session creation response format
- Phase 4 requires Phases 1-3
- Phase 5 can be done in parallel with Phase 4

## Validation Criteria
- [x] API requires session parameter and rejects requests without it
- [ ] WebUI stores session info from creation response
- [x] Messages route to exact session specified
- [x] No fallback or auto-detection occurs
- [x] Clear error messages when session is missing or invalid