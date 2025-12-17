# Session Detail Capability

## ADDED Requirements

### Requirement: Retrieve Session Details
The system SHALL provide an endpoint to retrieve comprehensive details about a specific MAS session.

#### Scenario: Get existing session details
Given a MAS session with ID "550e8400-e29b-41d4-a716-446655440000" exists
When a GET request is made to `/sessions/550e8400-e29b-41d4-a716-446655440000`
Then the response SHALL include complete session information including agents and windows

#### Scenario: Session not found
Given no session exists with ID "nonexistent-id"
When a GET request is made to `/sessions/nonexistent-id`
Then a 404 status code SHALL be returned with an appropriate error message

### Requirement: Agent Status Information
The session detail response SHALL include the status of all agents in the session.

#### Scenario: List all agents with their status
Given a session with 13 agents running
When session details are retrieved
Then the response SHALL include all 13 agents with their ID, name, status, window, and pane information

### Requirement: Window Configuration
The session detail response SHALL include tmux window configuration.

#### Scenario: Window information included
Given a session with 4 tmux windows
When session details are retrieved
Then the response SHALL include all windows with their name, index, pane count, and active status

### Requirement: Session Metadata
The system SHALL provide session metadata including last activity and original configuration.

#### Scenario: Metadata retrieval
Given a session started with specific agent configuration
When session details are retrieved
Then the response SHALL include startedAt, lastActivity timestamps and the original agent configuration