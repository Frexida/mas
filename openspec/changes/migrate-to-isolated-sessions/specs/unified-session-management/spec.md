# Unified Session Management

## REMOVED Requirements

### Requirement: Session mode parameter
The system SHALL NO LONGER support a sessionMode parameter in API requests or shell commands.

#### Scenario: API request without sessionMode
GIVEN a POST request to /runs
WHEN the request contains only agents configuration
THEN the system SHALL always create an isolated session
AND SHALL NOT require or check for sessionMode parameter

### Requirement: Legacy session mode
The system SHALL NO LONGER support legacy session mode with shared directories.

#### Scenario: Attempting to create legacy session
GIVEN a user tries to create a session with legacy mode indicators
WHEN the session creation is initiated
THEN the system SHALL ignore legacy mode requests
AND SHALL always create an isolated session with UUID

### Requirement: Fixed session naming
The system SHALL NO LONGER use fixed session names like "mas-tmux".

#### Scenario: Session naming
GIVEN any session creation request
WHEN a new session is created
THEN the session SHALL always be named "mas-{uuid-prefix}"
AND SHALL NOT use "mas-tmux" or other fixed names

## MODIFIED Requirements

### Requirement: Session creation default behavior
The system SHALL always create isolated sessions with dedicated workspaces.

#### Scenario: Default session creation
GIVEN a session creation request without special parameters
WHEN the session is initialized
THEN the system SHALL:
  1. Generate a UUID for the session
  2. Create directory "sessions/{uuid}/"
  3. Copy templates to the session workspace
  4. Name the tmux session "mas-{uuid-prefix}"
  5. Register in sessions.index

#### Scenario: Single user session
GIVEN a user running mas start without options
WHEN the command is executed
THEN the system SHALL create an isolated session
AND SHALL NOT create a legacy "mas-tmux" session

### Requirement: Session discovery
The system SHALL use only sessions.index as the source of truth for all sessions.

#### Scenario: Finding active sessions
GIVEN multiple sessions exist
WHEN the system queries for sessions
THEN it SHALL only read from sessions/.sessions.index
AND SHALL NOT check for .mas_session files
AND SHALL NOT distinguish between legacy and isolated modes

### Requirement: API response format
All API responses SHALL include full session workspace information.

#### Scenario: POST /runs response
GIVEN a successful session creation
WHEN the API returns a response
THEN it SHALL always include:
  - sessionId (full UUID)
  - tmuxSession (mas-{uuid-prefix})
  - workingDir (sessions/{uuid}/)
  - unitDir (sessions/{uuid}/unit/)
  - workflowsDir (sessions/{uuid}/workflows/)
AND SHALL NOT include sessionMode field

## ADDED Requirements

### Requirement: Migration warnings
The system SHALL warn users attempting to use deprecated legacy patterns.

#### Scenario: Detecting legacy session attempt
GIVEN a user runs a command expecting legacy behavior
WHEN the system detects legacy patterns (like SESSION_NAME=mas-tmux)
THEN it SHALL display a deprecation warning
AND SHALL proceed with isolated session creation
AND SHALL log the migration event

### Requirement: Workspace guarantee
Every session SHALL have its own isolated workspace directory.

#### Scenario: Workspace creation verification
GIVEN any session creation method (CLI or API)
WHEN the session is created
THEN the system SHALL guarantee:
  - A unique sessions/{uuid}/ directory exists
  - Templates are copied to the workspace
  - No sharing of directories between sessions
  - Complete isolation is maintained

### Requirement: Simplified session listing
The GET /sessions endpoint SHALL return all sessions without mode distinction.

#### Scenario: Listing all sessions
GIVEN multiple sessions exist
WHEN GET /sessions is called
THEN the response SHALL list all sessions uniformly
AND SHALL NOT include a "mode" field
AND SHALL treat all sessions as isolated

### Requirement: Consistent session lifecycle
All sessions SHALL follow the same lifecycle regardless of how they were created.

#### Scenario: Session lifecycle operations
GIVEN any session (created via API or CLI)
WHEN lifecycle operations are performed (start, stop, delete)
THEN the system SHALL:
  - Use the same code paths for all sessions
  - Apply the same validation rules
  - Maintain consistent state in sessions.index
  - Handle cleanup uniformly