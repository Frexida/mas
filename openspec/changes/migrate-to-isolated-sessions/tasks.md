# Implementation Tasks

## Phase 1: Remove Legacy Mode from Shell Scripts
- [ ] Remove SESSION_NAME="mas-tmux" default from mas_refactored.sh
- [ ] Remove MAS_SESSION_MODE environment variable checks
- [ ] Remove project mode session naming logic
- [ ] Update cmd_start() to always create isolated sessions
- [ ] Remove legacy mode conditionals from lib/session.sh
- [ ] Update session initialization to always use workspace
- [ ] Remove .mas_session file creation/reading logic

## Phase 2: Simplify API Request Handling
- [ ] Remove sessionMode from RunRequestSchema in validators/runs.ts
- [ ] Update POST /runs to always create isolated sessions
- [ ] Remove sessionMode from RunResponse interface
- [ ] Remove mode field from session types
- [ ] Update runs.ts to remove mode conditionals
- [ ] Simplify environment variable passing to shell scripts

## Phase 3: Update Session Manager
- [ ] Remove readSessionFile() function
- [ ] Remove legacy session detection in getAllSessions()
- [ ] Remove mode field from SessionInfo interface
- [ ] Simplify getSessionDetail() to only check isolated sessions
- [ ] Remove dual-mode logic from session discovery
- [ ] Update session status checks to use single method

## Phase 4: Clean Up Session Utilities
- [ ] Remove find_active_session() legacy checks
- [ ] Remove PROJECT_ROOT session detection
- [ ] Update cleanup_session() to handle only isolated
- [ ] Remove load_session_info() for legacy sessions
- [ ] Simplify session metadata handling

## Phase 5: Update WebUI Integration
- [ ] Remove mode display from session lists
- [ ] Update session creation UI to remove mode selection
- [ ] Simplify session detail display
- [ ] Remove legacy-specific UI elements
- [ ] Update WebUI API client to match new response format

## Phase 6: Migration Helpers
- [ ] Add deprecation warning for MAS_SESSION_MODE usage
- [ ] Add detection for existing mas-tmux sessions
- [ ] Create migration message for legacy attempts
- [ ] Update error messages to remove mode references
- [ ] Add logging for migration events

## Phase 7: Testing Updates
- [ ] Remove legacy mode tests
- [ ] Update existing tests to use isolated sessions only
- [ ] Add tests for migration warnings
- [ ] Verify single code path execution
- [ ] Test workspace creation for all scenarios
- [ ] Validate sessions.index as single source

## Phase 8: Documentation Updates
- [ ] Update API documentation to remove sessionMode
- [ ] Remove legacy mode from user guides
- [ ] Update ISOLATED_SESSIONS.md to reflect unified approach
- [ ] Create MIGRATION.md guide for existing users
- [ ] Update command examples in README
- [ ] Remove dual-mode explanations

## Phase 9: Cleanup and Validation
- [ ] Remove unused imports and variables
- [ ] Delete legacy-specific helper functions
- [ ] Run linting and fix issues
- [ ] Verify no legacy code remains
- [ ] Test full session lifecycle
- [ ] Run openspec validate for changes

## Phase 10: Final Integration Testing
- [ ] Test session creation via CLI
- [ ] Test session creation via API
- [ ] Verify WebUI displays all sessions correctly
- [ ] Test concurrent session creation
- [ ] Verify session cleanup works properly
- [ ] Confirm migration warnings appear correctly

## Parallel Work Opportunities
The following can be done in parallel:
- Phase 1-2: Shell and API changes
- Phase 5: WebUI updates (once API interface is defined)
- Phase 8: Documentation (can start early)

## Dependencies
- Phase 3 depends on Phase 2 (API changes)
- Phase 4 depends on Phase 1 (shell changes)
- Phase 6 should be done before Phase 7
- Phase 9-10 require all implementation complete

## Success Criteria
- [ ] No legacy mode code remains
- [ ] All sessions use isolated workspaces
- [ ] API responses are consistent
- [ ] WebUI shows all sessions correctly
- [ ] Migration warnings work properly
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] OpenSpec validation passes