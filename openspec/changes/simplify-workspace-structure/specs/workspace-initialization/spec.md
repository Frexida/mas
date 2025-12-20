# Workspace Initialization Specification

## ADDED Requirements

### Requirement: Local Workspace Initialization
The system SHALL create all workspace directories in the current directory when `mas init` is executed.

#### Scenario: Initialize new project workspace
Given a clean directory
When the user runs `mas init --name myproject`
Then the following directory structure SHALL be created in the current directory:
- `config.json` with project configuration
- `sessions/` directory for session management
- `unit/` directory for agent templates
- `workflows/` directory for workflow templates
- `logs/` directory for log files
- `templates/` directory for template library
- `.masrc` file as project marker

#### Scenario: Workspace files visibility
Given an initialized MAS project
When the user lists directory contents with `ls -a`
Then all workspace directories SHALL be visible without hidden prefixes
And the only hidden file SHALL be `.masrc` for backward compatibility

### Requirement: Unified Configuration Storage
The system SHALL store all configuration in a single `config.json` file in the workspace root.

#### Scenario: Configuration file creation
Given the user runs `mas init --name testproject`
When initialization completes
Then a `config.json` file SHALL exist in the current directory
And it SHALL contain:
- `"version"`: MAS version
- `"projectName"`: specified project name
- `"createdAt"`: ISO 8601 timestamp
- `"workspaceRoot"`: absolute path to current directory

### Requirement: Process Management Files Location
The system SHALL create process management files in the workspace root directory.

#### Scenario: API and Web server startup
Given an initialized MAS workspace
When the user runs `mas start`
Then the following files SHALL be created in the workspace root:
- `api.pid` containing the API server process ID
- `api.log` containing API server logs
- `web.pid` containing the Web server process ID
- `web.log` containing Web server logs

## MODIFIED Requirements

### Requirement: Session Workspace Creation
The system SHALL create session workspaces under `{workspace_root}/sessions/` instead of `~/.mas/sessions/`.

#### Scenario: Session creation in workspace
Given an initialized MAS workspace at `/projects/myproject`
When the user runs `mas start`
Then a new session directory SHALL be created at `/projects/myproject/sessions/{session-uuid}/`
And the session SHALL use this directory as its working directory

### Requirement: Project Detection
The system SHALL detect initialized projects by checking for workspace markers in the current directory tree.

#### Scenario: Project root detection
Given a MAS project initialized at `/projects/myproject`
And the current directory is `/projects/myproject/subdir`
When MAS commands are executed
Then the system SHALL find the project root by locating `.masrc` file
And use `/projects/myproject` as the workspace root

#### Scenario: New workspace structure detection
Given a directory with the new workspace structure
When checking if project is initialized
Then the system SHALL verify existence of:
- `.masrc` file (backward compatibility)
- `config.json` file
- `sessions/` directory
- `unit/` directory

## REMOVED Requirements

### Requirement: Global Data Directory
The system SHALL NO LONGER create or use `~/.mas` as a global data directory.

#### Scenario: No global directory creation
Given a fresh system without MAS
When the user runs `mas init`
Then NO directory SHALL be created at `~/.mas`
And all data SHALL be stored in the local workspace

### Requirement: Hidden .mas Directory
The system SHALL NO LONGER create `.mas/` directory in project roots.

#### Scenario: No hidden configuration directory
Given the user runs `mas init`
When initialization completes
Then NO `.mas/` directory SHALL be created
And configuration SHALL be stored in visible `config.json` file