# Tasks: Simplify Workspace Structure

## Phase 1: Core Structure Changes

- [x] Update `mas-core.sh` initialization function
  - Modify `cmd_init()` to create new directory structure
  - Remove `.mas` directory creation
  - Create visible directories: sessions, logs, templates, config
  - Generate `config.json` instead of `.mas/config.json`

- [x] Update environment variable handling in `mas-core.sh`
  - Remove `MAS_DATA_DIR` references
  - Add `MAS_WORKSPACE_ROOT` initialization
  - Update path resolution logic

- [x] Modify `lib/project.sh` project detection
  - Update `is_project_initialized()` for new structure
  - Modify `save_project_config()` to write to `config.json`
  - Update `load_project_config()` to read from new location

## Phase 2: Session Management Updates

- [x] Update `lib/mas-session.sh` workspace creation
  - Modify `create_session_workspace()` to use workspace root
  - Update session directory paths
  - Change session index location

- [x] Update `scripts/start_session.sh`
  - Change `MAS_DATA_DIR` to `MAS_WORKSPACE_ROOT`
  - Update session directory creation paths
  - Modify metadata file locations

- [x] Update session metadata management
  - Update `create_session_metadata()` paths
  - Modify `load_session_metadata()` paths
  - Update `update_sessions_index()` location

## Phase 3: Process Management

- [x] Update API server management
  - Change pid file location to workspace root
  - Update log file location to workspace root
  - Modify startup scripts

- [x] Update Web server management
  - Change pid file location to workspace root
  - Update log file location to workspace root
  - Modify startup scripts

- [x] Update process status checking
  - Modify `cmd_status()` to check new locations
  - Update log file references in output

## Phase 4: API Layer Updates

- [x] Update TypeScript session manager
  - Modify `api/utils/session-manager.ts` paths
  - Update session discovery logic
  - Change from `~/.mas` to workspace-relative paths

- [x] Update API configuration
  - Modify environment variable usage
  - Update default paths
  - Add workspace root detection

- [x] Update tmux utility functions
  - Ensure session paths use workspace root
  - Update working directory references

## Phase 5: Backward Compatibility

- [x] Implement legacy detection
  - Check for existing `~/.mas` directory
  - Detect old `.mas/` project directory
  - Display migration suggestions

- [ ] Create migration helper (optional)
  - Implement `mas migrate` command
  - Copy sessions from `~/.mas` to workspace
  - Update configuration files

- [x] Add compatibility warnings
  - Warn when old structure detected
  - Suggest migration path
  - Document breaking changes

## Phase 6: Testing and Validation

- [x] Test fresh installation
  - Verify `mas init` creates correct structure
  - Confirm no `~/.mas` directory created
  - Validate all files in workspace

- [ ] Test session lifecycle
  - Verify session creation in workspace
  - Confirm isolation between projects
  - Test multi-session support

- [ ] Test process management
  - Verify pid/log files in workspace
  - Test start/stop/status commands
  - Confirm clean shutdown

- [ ] Test API functionality
  - Verify session list endpoint
  - Test session detail retrieval
  - Confirm workspace paths in responses

## Phase 7: Documentation

- [x] Update command help text
  - Modify `mas init` description
  - Update environment variable docs
  - Document new directory structure

- [x] Update README.md
  - Document new workspace structure
  - Explain migration from old structure
  - Add troubleshooting section

- [ ] Create migration guide
  - Step-by-step migration instructions
  - Common issues and solutions
  - Rollback procedures

## Validation Criteria

- All tests pass with new structure
- No references to `~/.mas` in code
- Sessions isolated per workspace
- Backward compatibility maintained
- Clean migration path available