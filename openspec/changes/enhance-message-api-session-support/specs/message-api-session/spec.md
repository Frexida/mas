# Message API Session Support Specification

## ADDED Requirements

### Requirement: Session Parameter in Message Requests
The Message API SHALL require a `session` parameter to specify the target tmux session.

#### Scenario: Send message to specific session
Given a valid tmux session "mas-abc123" exists
When a POST request is made to `/message` with body:
```json
{
  "target": "10",
  "message": "Hello Agent",
  "session": "mas-abc123"
}
```
Then the message SHALL be routed to session "mas-abc123"
And the response SHALL include confirmation of the session used

#### Scenario: Send message without session (error case)
Given multiple tmux sessions exist
When a POST request is made to `/message` without a session parameter
Then the API SHALL return 400 Bad Request
And the error message SHALL indicate "Session parameter is required"

### Requirement: Session Validation
The Message API SHALL validate that the specified session exists before routing messages.

#### Scenario: Invalid session ID provided
Given no tmux session "mas-invalid" exists
When a POST request is made with session "mas-invalid"
Then the API SHALL return 400 Bad Request
And the error message SHALL indicate "Session not found"

#### Scenario: Valid session verification
Given a tmux session "mas-valid" exists
When a POST request is made with session "mas-valid"
Then the API SHALL verify the session exists
And proceed with message routing

## MODIFIED Requirements

### Requirement: Message Request Schema
The message request schema SHALL include a required session field.

#### Scenario: Schema validation with session
When a request includes a session field
Then the schema validation SHALL accept string values
And the field SHALL be required for all requests

### Requirement: Message Response Enhancement
The message response SHALL include session information when applicable.

#### Scenario: Response includes session confirmation
Given a message is sent with session "mas-123"
When the request succeeds
Then the response SHALL include:
```json
{
  "status": "acknowledged",
  "session": "mas-123",
  "target": "10",
  "message": "..."
}
```

## Session Handling

### Requirement: Direct Session Routing
The system SHALL use only the explicitly provided session parameter with no fallback.

#### Scenario: Session routing without fallback
Given a session "mas-specified" is provided in the request
When the message is processed
Then the message SHALL be sent ONLY to "mas-specified"
And no auto-detection or fallback SHALL occur

## Error Handling

### Requirement: Comprehensive Error Responses
The API SHALL provide specific error codes for session-related issues.

#### Scenario: Session not found
When a non-existent session is specified
Then return 400 with error code "SESSION_NOT_FOUND"

#### Scenario: No sessions available
When no MAS sessions exist
Then return 503 with error code "NO_SESSIONS_AVAILABLE"

#### Scenario: Session disconnected during operation
When a session becomes unavailable during message routing
Then return 410 with error code "SESSION_GONE"