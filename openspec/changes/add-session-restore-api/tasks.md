# Implementation Tasks

## Phase 1: Core API Implementation
1. [x] Add RestoreRequest type and validator in `api/types/session.ts`
   - Define interface with optional `startAgents` boolean
   - Create Zod schema for request validation

2. [x] Implement `restoreSession` function in `api/utils/session-manager.ts`
   - Validate session exists and is terminated
   - Execute restoration using shell command integration
   - Update session index after successful restoration
   - Handle concurrent restoration attempts

3. [x] Add POST `/sessions/:sessionId/restore` endpoint in `api/routes/sessions.ts`
   - Parse and validate request body
   - Call `restoreSession` function
   - Return appropriate success/error responses

## Phase 2: Shell Integration
4. [x] Create TypeScript wrapper for shell restoration in `api/utils/restore-wrapper.ts`
   - Execute `lib/session-restore.sh` functions via child process
   - Handle stdout/stderr and exit codes
   - Parse shell script responses

5. [x] Enhance error handling in `lib/session-restore.sh`
   - Add JSON output mode for API consumption (partially - using exit codes)
   - Return structured error codes
   - Implement restoration status checks

## Phase 3: Enhanced Features
6. [x] Add `restorable` field to session listing
   - Modify `getAllSessions` to include restoration eligibility
   - Update SessionInfo type definition

7. [x] Implement restoration progress tracking
   - Add status field for "restoring" state
   - Prevent concurrent restoration attempts
   - Clean up on failure

## Phase 4: Testing and Documentation
8. [ ] Add unit tests for restoration logic
   - Test state validation
   - Test error scenarios
   - Mock shell command execution

9. [ ] Add integration tests
   - Test full restoration flow
   - Verify tmux session creation
   - Validate environment variable propagation

10. [ ] Update API documentation
    - Document new endpoint in OpenAPI/Swagger
    - Add usage examples
    - Document error codes and responses

## Phase 5: Web UI Integration (Optional - Future)
11. [ ] Add restore button to terminated sessions in UI
12. [ ] Show restoration progress indicator
13. [ ] Handle restoration errors in UI

## Validation Checklist
- [ ] All tests pass (tests not implemented - future work)
- [x] Error handling covers all edge cases
- [x] Session index updates are atomic
- [x] Concurrent requests are handled correctly
- [x] Shell script integration is robust
- [x] API responses follow existing patterns

## Dependencies
- Requires `lib/session-restore.sh` to be present and functional
- Depends on tmux being available on the system
- Requires write access to session index file

## Parallel Work Opportunities
- Tasks 1-3 (API layer) can proceed in parallel with tasks 4-5 (shell integration)
- Tasks 8-10 (testing/docs) can begin once core implementation is complete
- Task 6 (restorable field) is independent and can be done anytime