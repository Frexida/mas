# API Simplification

## REMOVED Requirements

### Requirement: SessionMode field in requests
The API SHALL NO LONGER accept sessionMode in request payloads.

#### Scenario: POST /runs without sessionMode
GIVEN a POST request to /runs
WITH body: {"agents": {...}}
WHEN the request is processed
THEN the API SHALL NOT look for sessionMode field
AND SHALL proceed with isolated session creation

### Requirement: Mode field in responses
The API SHALL NO LONGER include mode field in session responses.

#### Scenario: Session information response
GIVEN a request for session information
WHEN the API returns session data
THEN the response SHALL NOT include "mode" field
AND SHALL NOT distinguish between session types

## MODIFIED Requirements

### Requirement: RunRequest schema
The RunRequest schema SHALL only require agents configuration.

#### Scenario: Validating run requests
GIVEN a POST /runs request
WHEN the request is validated
THEN the schema SHALL only validate:
  - agents (required)
  - agents.metaManager (optional)
  - agents.units (required array)
AND SHALL NOT validate sessionMode

### Requirement: Session discovery logic
The session-manager SHALL only use sessions.index for discovery.

#### Scenario: getAllSessions implementation
GIVEN a call to getAllSessions()
WHEN the function executes
THEN it SHALL:
  1. Read sessions/.sessions.index
  2. Verify tmux processes for each entry
  3. Return all valid sessions
AND SHALL NOT check legacy session files

### Requirement: Session detail retrieval
The getSessionDetail function SHALL assume all sessions are isolated.

#### Scenario: Getting session details
GIVEN a session ID
WHEN getSessionDetail(sessionId) is called
THEN it SHALL:
  1. Look for sessions/{sessionId}/ directory
  2. Read .session metadata file
  3. Return workspace information
AND SHALL NOT check for legacy session markers

## ADDED Requirements

### Requirement: Consistent session creation
POST /runs SHALL always create isolated sessions with workspaces.

#### Scenario: Creating a session via API
GIVEN a POST /runs request with valid agents
WHEN the session is created
THEN the API SHALL:
  1. Generate UUID session ID
  2. Create sessions/{uuid}/ directory
  3. Initialize workspace with templates
  4. Start tmux with mas-{uuid-prefix} name
  5. Return full workspace paths

### Requirement: Simplified session endpoints
All session endpoints SHALL operate on unified session model.

#### Scenario: Session operations
GIVEN any session operation endpoint
WHEN the operation is performed
THEN the endpoint SHALL:
  - Assume isolated session structure
  - Use sessions/{uuid}/ paths
  - Update sessions.index
  - Not check for session mode

### Requirement: Clean error messages
Error messages SHALL not reference legacy or isolated modes.

#### Scenario: Session not found error
GIVEN a request for non-existent session
WHEN the error is returned
THEN the message SHALL be "Session not found: {id}"
AND SHALL NOT mention mode or type

### Requirement: Workspace information in all responses
All session-related responses SHALL include workspace paths.

#### Scenario: Session list response
GIVEN a GET /sessions request
WHEN the response is generated
THEN each session entry SHALL include:
  - sessionId
  - tmuxSession
  - workingDir
  - unitDir
  - workflowsDir
  - status
  - createdAt