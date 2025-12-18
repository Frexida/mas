# Implementation Tasks

## Phase 1: Refactor mas start command
- [x] Remove session creation logic from `mas start`
- [x] Keep only API and WebUI startup in `mas start`
- [x] Remove `--config`, `--skip-init`, `--no-attach` options
- [x] Update help text and documentation
- [x] Test infrastructure-only startup

## Phase 2: Create mas session command (SKIPPED - per user request)
- ~~[ ] Implement `mas session create` subcommand~~
- ~~[ ] Move session creation logic from old `mas start`~~
- ~~[ ] Support `--config` option for initialization~~
- ~~[ ] Implement `mas session list` to show active sessions~~
- ~~[ ] Implement `mas session stop <id>` for cleanup~~
- ~~[ ] Add `mas session attach <id>` for tmux attachment~~

## Phase 3: Refactor /runs endpoint
- [x] Create dedicated session creation function in API (using start_session.sh script)
- [x] Remove dependency on CLI `mas start` command
- [ ] Directly manage tmux sessions from Node.js (using shell script for now)
- [x] Implement proper error handling and cleanup
- [ ] Add session state tracking in API

## Phase 4: Update WebUI
- [x] Update UI to reflect new session lifecycle (no changes needed)
- [ ] Add session management interface (list, stop, restart)
- [ ] Improve error messages for session creation failures
- [ ] Add visual feedback for session states

## Phase 5: Documentation and Migration
- [x] Update README with new command structure
- [ ] Create migration guide for existing users
- [ ] Update API documentation
- [ ] Add examples for common workflows
- [ ] Update npm package documentation

## Validation
- [x] Test WebUI can create sessions without duplicates
- [x] Verify CLI and API don't interfere with each other
- [x] Confirm no regression in existing workflows
- [ ] Performance test with multiple concurrent sessions
- [ ] Test cleanup of orphaned sessions