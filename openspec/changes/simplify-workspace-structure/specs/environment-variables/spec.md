# Environment Variables Specification

## REMOVED Requirements

### Requirement: MAS_DATA_DIR Deprecation
The system SHALL NOT use or set the `MAS_DATA_DIR` environment variable.

#### Scenario: No global data directory variable
Given MAS is installed and initialized
When any MAS command is executed
Then `MAS_DATA_DIR` SHALL NOT be set in the environment
And the system SHALL NOT reference `$HOME/.mas`

#### Scenario: Legacy variable ignored
Given an environment where `MAS_DATA_DIR` is manually set
When MAS commands are executed
Then the system SHALL ignore `MAS_DATA_DIR`
And use workspace-relative paths instead

## ADDED Requirements

### Requirement: Workspace Root Variable
The system SHALL set and use `MAS_WORKSPACE_ROOT` to identify the current workspace.

#### Scenario: Workspace root discovery
Given a MAS project initialized at `/projects/myapp`
And the current directory is `/projects/myapp/subdir`
When MAS commands are executed
Then `MAS_WORKSPACE_ROOT` SHALL be set to `/projects/myapp`

#### Scenario: Workspace root usage
Given `MAS_WORKSPACE_ROOT` is set
When accessing workspace resources
Then all paths SHALL be resolved relative to `$MAS_WORKSPACE_ROOT`:
- Sessions: `$MAS_WORKSPACE_ROOT/sessions`
- Units: `$MAS_WORKSPACE_ROOT/unit`
- Logs: `$MAS_WORKSPACE_ROOT/logs`
- Config: `$MAS_WORKSPACE_ROOT/config.json`

### Requirement: Project Root Alias
The system SHALL set `MAS_PROJECT_ROOT` as an alias to `MAS_WORKSPACE_ROOT`.

#### Scenario: Backward compatibility alias
Given a script using `$MAS_PROJECT_ROOT`
When executed in a MAS workspace
Then `MAS_PROJECT_ROOT` SHALL equal `MAS_WORKSPACE_ROOT`
And both SHALL point to the workspace root directory

## MODIFIED Requirements

### Requirement: Session Directory Variable
The system SHALL set `MAS_SESSION_DIR` relative to the workspace root.

#### Scenario: Session directory path
Given a workspace at `/work/project`
And a session with ID `abc123`
When the session is active
Then `MAS_SESSION_DIR` SHALL be `/work/project/sessions/abc123`
And NOT `~/.mas/sessions/abc123`

### Requirement: Environment Variable Hierarchy
The system SHALL establish a clear hierarchy for path resolution.

#### Scenario: Variable precedence
Given MAS needs to resolve a workspace path
When multiple variables are available
Then the precedence SHALL be:
1. Explicit command-line arguments
2. `MAS_WORKSPACE_ROOT` environment variable
3. Project root found via `.masrc` search
4. Current working directory

#### Scenario: Child process inheritance
Given a MAS session is running
When child processes are spawned (agents, scripts)
Then they SHALL inherit:
- `MAS_WORKSPACE_ROOT`: workspace root path
- `MAS_SESSION_DIR`: current session directory
- `MAS_SESSION_ID`: session UUID
- `MAS_SESSION_NAME`: tmux session name