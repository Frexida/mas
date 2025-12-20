# Session Management Specification

## MODIFIED Requirements

### Requirement: Session Directory Location
The system SHALL create session directories under the workspace root instead of a global directory.

#### Scenario: Session workspace creation
Given an initialized MAS workspace at `/work/project1`
When a new session is started with ID `abc123`
Then the session workspace SHALL be created at `/work/project1/sessions/abc123/`
And NOT at `~/.mas/sessions/abc123/`

#### Scenario: Multiple project session isolation
Given two MAS projects at `/work/project1` and `/work/project2`
When sessions are started in each project
Then project1 sessions SHALL be in `/work/project1/sessions/`
And project2 sessions SHALL be in `/work/project2/sessions/`
And the sessions SHALL be completely isolated

### Requirement: Session Index Management
The system SHALL maintain a session index file within the workspace sessions directory.

#### Scenario: Session index location
Given an initialized MAS workspace
When sessions are created or modified
Then the session index SHALL be updated at `{workspace_root}/sessions/.index`
And NOT at `~/.mas/sessions/.index`

#### Scenario: Session index content
Given multiple active sessions in a workspace
When reading the session index
Then each line SHALL contain: `{session-id}:{status}:{timestamp}`
And the file SHALL be append-only for active sessions

### Requirement: Session Metadata Storage
The system SHALL store session metadata in the session's own directory.

#### Scenario: Metadata file creation
Given a new session with ID `xyz789`
When the session is created
Then a `metadata.json` file SHALL exist at `{workspace_root}/sessions/xyz789/metadata.json`
And it SHALL contain:
- `"sessionId"`: session UUID
- `"sessionName"`: tmux session name
- `"workingDir"`: session workspace path
- `"startedAt"`: ISO 8601 timestamp
- `"status"`: session status

## ADDED Requirements

### Requirement: Workspace-Relative Paths
The system SHALL use workspace-relative paths for all session operations.

#### Scenario: Environment variable setup
Given a MAS workspace at `/projects/mas-app`
When a session is started
Then the following environment variables SHALL be set:
- `MAS_WORKSPACE_ROOT=/projects/mas-app`
- `MAS_SESSION_DIR=/projects/mas-app/sessions/{session-id}`
And `MAS_DATA_DIR` SHALL NOT be set

#### Scenario: Session working directory
Given a session in workspace `/projects/app1`
When tmux windows are created for the session
Then each window's working directory SHALL be `/projects/app1/sessions/{session-id}`
And NOT `~/.mas/sessions/{session-id}`

### Requirement: Portable Session References
The system SHALL reference sessions using workspace-relative paths.

#### Scenario: Session API responses
Given a session in workspace `/work/project`
When the API returns session information
Then the `workingDir` field SHALL be `/work/project/sessions/{session-id}`
And paths SHALL be absolute from filesystem root
And NOT reference `~/.mas`

#### Scenario: Session discovery
Given a MAS workspace with multiple sessions
When listing available sessions
Then the system SHALL scan `{workspace_root}/sessions/` directory
And NOT scan `~/.mas/sessions/`