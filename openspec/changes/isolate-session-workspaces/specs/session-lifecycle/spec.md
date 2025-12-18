# Session Lifecycle Management

## ADDED Requirements

### Requirement: Session creation with workspace
The system SHALL create a complete isolated workspace when starting a new session in isolated mode.

#### Scenario: Creating a session via API
GIVEN a POST request to /runs with a valid configuration
AND the environment variable MAS_SESSION_MODE is set to "isolated"
WHEN the session is created
THEN the system SHALL:
  1. Generate a UUID for the session
  2. Create the directory "sessions/{uuid}/"
  3. Copy templates to the session workspace
  4. Save the configuration to "sessions/{uuid}/config.json"
  5. Create a tmux session named "mas-{uuid-prefix}"
  6. Return the session ID and workspace path in the response

### Requirement: Session discovery
The system SHALL maintain a registry of all active sessions in the ".sessions.index" file.

#### Scenario: Registering a new session
GIVEN a new session with ID "550e8400-e29b-41d4-a716-446655440000"
WHEN the session is successfully created
THEN an entry SHALL be added to "sessions/.sessions.index"
AND the entry SHALL contain:
  - sessionId: the full UUID
  - tmuxSession: the tmux session name
  - status: "active"
  - createdAt: ISO-8601 timestamp
  - workingDir: absolute path to session directory

#### Scenario: Listing all sessions
GIVEN multiple sessions exist in the system
WHEN GET /sessions is called
THEN the system SHALL read the .sessions.index file
AND return all sessions with their current status
AND verify each session's tmux process is still running

### Requirement: Session termination
The system SHALL properly clean up resources when a session is terminated.

#### Scenario: Stopping a session
GIVEN an active session with ID "550e8400-e29b-41d4-a716-446655440000"
WHEN the session is stopped
THEN the system SHALL:
  1. Kill the tmux session "mas-{uuid-prefix}"
  2. Update the session status to "stopped" in .sessions.index
  3. Update the STATUS field in ".session" file to "stopped"
  4. Preserve the session directory and its contents
  5. Stop any associated HTTP server processes

### Requirement: Session mode detection
The system SHALL support dual-mode operation based on the MAS_SESSION_MODE environment variable.

#### Scenario: Starting in isolated mode
GIVEN the environment variable MAS_SESSION_MODE="isolated"
WHEN mas_refactored.sh start is executed
THEN the system SHALL use isolated session workspaces
AND create a new session directory under "sessions/"
AND use session-specific unit and workflow directories

#### Scenario: Starting in legacy mode
GIVEN the environment variable MAS_SESSION_MODE="legacy" or is unset
WHEN mas_refactored.sh start is executed
THEN the system SHALL use the traditional shared directories
AND use the default "unit/" and "workflows/" directories
AND follow the existing single-session behavior

## MODIFIED Requirements

### Requirement: Session ID usage
The system SHALL use the full UUID as the primary session identifier throughout the application.

#### Scenario: Session ID in API responses
GIVEN a session with UUID "550e8400-e29b-41d4-a716-446655440000"
WHEN the session information is returned via API
THEN the sessionId field SHALL contain the full UUID
AND the tmuxSession field SHALL contain the shortened form "mas-550e8400"

### Requirement: Working directory configuration
The mas_refactored.sh script SHALL set working directories based on session mode.

#### Scenario: Setting directories in isolated mode
GIVEN a session in isolated mode with ID stored in MAS_SESSION_ID
WHEN mas_refactored.sh start is executed
THEN the following variables SHALL be set:
  - UNIT_DIR="$MAS_ROOT/sessions/$MAS_SESSION_ID/unit"
  - WORKFLOWS_DIR="$MAS_ROOT/sessions/$MAS_SESSION_ID/workflows"
  - SESSION_NAME="mas-${MAS_SESSION_ID:0:8}"

#### Scenario: Setting directories in legacy mode
GIVEN a session in legacy mode
WHEN mas_refactored.sh start is executed
THEN the following variables SHALL be set:
  - UNIT_DIR="$MAS_ROOT/unit"
  - WORKFLOWS_DIR="$MAS_ROOT/workflows"
  - SESSION_NAME based on existing logic