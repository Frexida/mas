# Session Lifecycle Management

## ADDED Requirements

### Requirement: Stop Session Endpoint
The system SHALL provide an endpoint to gracefully stop a MAS session.

#### Scenario: Graceful session termination
Given an active MAS session
When a POST request is made to `/sessions/{sessionId}/stop`
Then the session and all its agents SHALL be terminated gracefully

#### Scenario: Force stop option
Given a session that is not responding
When a POST request is made with `{"force": true}`
Then the session SHALL be forcefully terminated

### Requirement: Session State Transitions
The system SHALL properly manage session state transitions throughout its lifecycle.

#### Scenario: Active to inactive transition
Given an active session with running agents
When all agents stop or crash
Then the session status SHALL change to "inactive"

#### Scenario: Inactive to terminated transition
Given an inactive session
When the tmux session is destroyed
Then the session status SHALL change to "terminated"

## MODIFIED Requirements

### Requirement: Enhanced Status Endpoint
The existing `/status` endpoint SHALL be enhanced to support session-specific queries.

#### Scenario: Status with session context
Given multiple MAS sessions exist
When a GET request is made to `/status?sessionId={id}`
Then only the status for the specified session SHALL be returned

#### Scenario: Backward compatibility
Given existing clients using `/status` without parameters
When a GET request is made to `/status`
Then the response SHALL maintain the original format for the default session