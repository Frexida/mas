# API Integration for Session Isolation

## ADDED Requirements

### Requirement: Session mode parameter in /runs endpoint
The POST /runs endpoint SHALL accept an optional sessionMode parameter to specify isolated or legacy mode.

#### Scenario: Creating a session in isolated mode via API
GIVEN a POST request to /runs with body:
```json
{
  "agents": {...},
  "sessionMode": "isolated"
}
```
WHEN the request is processed
THEN the system SHALL create an isolated session workspace
AND set MAS_SESSION_MODE="isolated" when executing mas_refactored.sh
AND return the session workspace path in the response

#### Scenario: Creating a session without mode specification
GIVEN a POST request to /runs without a sessionMode field
WHEN the request is processed
THEN the system SHALL default to "legacy" mode
AND maintain backward compatibility with existing clients

### Requirement: Session workspace information in responses
API responses SHALL include workspace directory information for isolated sessions.

#### Scenario: Response for isolated session creation
GIVEN a successful session creation in isolated mode
WHEN the POST /runs response is returned
THEN it SHALL include:
  - sessionId: the full UUID
  - tmuxSession: the tmux session name
  - workingDir: the absolute path to "sessions/{uuid}/"
  - sessionMode: "isolated"
  - unitDir: the path to "sessions/{uuid}/unit/"
  - workflowsDir: the path to "sessions/{uuid}/workflows/"

### Requirement: Session listing with workspace paths
The GET /sessions endpoint SHALL return workspace information for each session.

#### Scenario: Listing sessions with workspace details
GIVEN multiple sessions exist in isolated mode
WHEN GET /sessions is called
THEN each session object SHALL include:
  - sessionId: the full UUID
  - workingDir: the session workspace path
  - mode: "isolated" or "legacy"
  - status: current session status
  - createdAt: creation timestamp

## MODIFIED Requirements

### Requirement: Session detail endpoint enhancement
The GET /sessions/:sessionId endpoint SHALL return detailed workspace information.

#### Scenario: Getting isolated session details
GIVEN a session in isolated mode with ID "550e8400-e29b-41d4-a716-446655440000"
WHEN GET /sessions/550e8400-e29b-41d4-a716-446655440000 is called
THEN the response SHALL include:
  - Complete workspace directory structure
  - List of unit directories and their paths
  - Configuration file location
  - Log directory path
  - Session metadata from .session file

### Requirement: Session manager workspace handling
The session-manager.ts utility SHALL handle both legacy and isolated session workspaces.

#### Scenario: Finding session by ID in isolated mode
GIVEN a session ID "550e8400-e29b-41d4-a716-446655440000"
AND the session exists in isolated mode
WHEN getSessionDetail() is called
THEN it SHALL:
  1. Check for "sessions/{sessionId}/" directory
  2. Read the .session metadata file
  3. Verify the tmux session exists
  4. Return complete session information including workspace paths

#### Scenario: Finding session in legacy mode
GIVEN a session in legacy mode
WHEN getSessionDetail() is called
THEN it SHALL use the existing logic to find tmux sessions
AND return appropriate paths for shared directories

### Requirement: Configuration file persistence
The system SHALL persist session configuration files in isolated workspaces.

#### Scenario: Saving configuration in isolated mode
GIVEN a session creation request with configuration
WHEN the session is created in isolated mode
THEN the configuration SHALL be saved to "sessions/{uuid}/config.json"
AND the temporary config file in /tmp SHALL be deleted after initialization
AND the persisted config SHALL be available for session recovery

#### Scenario: Configuration in legacy mode
GIVEN a session creation in legacy mode
WHEN the session is created
THEN the existing behavior SHALL be maintained
AND the config file SHALL be temporarily stored and then deleted as before