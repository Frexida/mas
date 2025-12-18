# Implementation Tasks

## Phase 1: Foundation (Directory Structure)
- [x] Create `sessions/` directory in MAS root
- [x] Implement UUID generation function in lib/session.sh
- [x] Add `create_session_workspace()` function to lib/session.sh
- [x] Add `initialize_session_units()` function to copy templates
- [x] Create `.sessions.index` file structure and access functions
- [x] Add session metadata (.session) file creation and parsing

## Phase 2: Shell Script Updates
- [x] Add MAS_SESSION_MODE environment variable support to mas_refactored.sh
- [x] Update `cmd_start()` to detect session mode
- [x] Modify unit directory resolution based on mode
- [x] Update workflow directory resolution based on mode
- [x] Add session workspace path to environment variables
- [x] Update tmux session naming to include UUID prefix in isolated mode
- [x] Ensure backward compatibility with legacy mode

## Phase 3: API Foundation Updates
- [x] Add sessionMode field to RunRequestSchema in validators/runs.ts
- [x] Update generateSessionId() to ensure full UUID v4 generation
- [x] Add session workspace creation logic to POST /runs
- [x] Update config file saving to persist in session directory
- [x] Add workspace paths to RunResponse interface
- [x] Pass MAS_SESSION_MODE and MAS_SESSION_ID to mas_refactored.sh

## Phase 4: Session Management Functions
- [x] Create `load_session_metadata()` function in lib/session.sh
- [x] Implement session registry update functions
- [x] Add `find_session_by_id()` function
- [ ] Update `find_active_session()` to check isolated sessions
- [x] Add workspace path resolution functions
- [x] Implement session status tracking in metadata

## Phase 5: API Session Management
- [x] Update session-manager.ts getAllSessions() for isolated mode
- [x] Modify getSessionDetail() to read from session workspaces
- [x] Add workspace directory scanning logic
- [x] Update session discovery to use .sessions.index
- [x] Add session mode detection to API responses
- [x] Include workspace paths in session listings

## Phase 6: Agent Initialization Updates
- [ ] Update agent working directory setting in lib/agent.sh
- [ ] Modify `start_agent()` to use session-specific directories
- [ ] Update `initialize_agents_from_config()` for isolated paths
- [ ] Ensure agents read from correct workflow directories
- [ ] Update message routing to use session-specific paths

## Phase 7: Session Lifecycle Management
- [x] Implement `stop_isolated_session()` function
- [x] Update session cleanup to preserve workspace
- [x] Add session status updates to metadata
- [x] Update .sessions.index on session stop
- [ ] Ensure tmux session cleanup works with UUID names
- [x] Add error handling for missing session workspaces

## Phase 8: Testing Infrastructure
- [x] Create test script for isolated mode session creation
- [x] Add tests for workspace directory structure
- [x] Test template copying functionality
- [x] Verify session metadata creation and parsing
- [x] Test dual-mode operation switching
- [ ] Add concurrent session creation tests

## Phase 9: Integration Testing
- [x] Test full session lifecycle in isolated mode
- [ ] Verify API endpoints with isolated sessions
- [ ] Test multiple concurrent sessions
- [x] Validate session discovery across modes
- [x] Test session stop and cleanup
- [x] Verify backward compatibility with legacy mode

## Phase 10: Documentation and Validation
- [x] Document MAS_SESSION_MODE environment variable
- [x] Update API documentation for new fields
- [x] Document session workspace structure
- [ ] Create migration guide from legacy to isolated mode
- [ ] Add troubleshooting guide for session issues
- [x] Run openspec validate for all changes

## Parallel Work Opportunities
The following task groups can be worked on in parallel:
- Phase 1-2: Foundation and shell scripts (core infrastructure)
- Phase 3-5: API updates (can progress independently)
- Phase 8: Testing infrastructure (can start early)

## Dependencies
- Phase 4 depends on Phase 1 (workspace structure)
- Phase 6 depends on Phase 2 (shell updates)
- Phase 7 depends on Phase 4 (session management functions)
- Phase 9 depends on all implementation phases
- Phase 10 depends on Phase 9 completion

## Validation Checkpoints
1. After Phase 2: Manual test of isolated session creation
2. After Phase 5: API endpoint testing with Postman/curl
3. After Phase 7: Full lifecycle test (create, use, stop)
4. After Phase 9: Load testing with multiple sessions
5. After Phase 10: Final openspec validation

## Success Criteria
- [ ] Sessions can be created in isolated mode via API
- [ ] Each session has its own workspace directory
- [ ] Multiple sessions can run concurrently without interference
- [ ] Legacy mode continues to work unchanged
- [ ] Session metadata is properly maintained
- [ ] API returns correct workspace information
- [ ] Sessions can be stopped and cleaned up properly
- [ ] All tests pass in both modes
- [ ] OpenSpec validation passes without errors