# Session Connect Capability

## ADDED Requirements

### Requirement: Connect to Existing Session
The system SHALL provide an endpoint to establish connection to an existing MAS session.

#### Scenario: Successful connection
Given an existing MAS session with ID "550e8400-e29b-41d4-a716-446655440000"
When a POST request is made to `/sessions/550e8400-e29b-41d4-a716-446655440000/connect`
Then the response SHALL include connection details and attach command

#### Scenario: Connect to non-existent session
Given no session exists with ID "invalid-id"
When a POST request is made to `/sessions/invalid-id/connect`
Then a 404 status code SHALL be returned

### Requirement: Connection Options
The connect endpoint SHALL support optional parameters for connection behavior.

#### Scenario: Force reconnection
Given a session that is already connected
When a POST request is made with `{"reconnect": true}`
Then the system SHALL force a new connection and return updated connection info

#### Scenario: Connect to specific window
Given a session with multiple windows
When a POST request is made with `{"window": "development"}`
Then the connection SHALL focus on the development window

### Requirement: Connection Validation
The system SHALL validate session state before allowing connection.

#### Scenario: Prevent connection to terminated session
Given a session with status "terminated"
When a connection attempt is made
Then a 409 status code SHALL be returned with error message

### Requirement: Connection Response
The connection response SHALL provide all necessary information for the UI to interact with the session.

#### Scenario: Complete connection information
Given a successful connection
When the response is returned
Then it SHALL include sessionId, tmuxSession, attachCommand, status, timestamp, and connectionDetails