# Session List Capability

## ADDED Requirements

### Requirement: List All MAS Sessions
The system SHALL provide an endpoint to retrieve a list of all MAS tmux sessions, including both active and inactive sessions.

#### Scenario: Retrieve all sessions
Given multiple MAS sessions exist in tmux
When a GET request is made to `/sessions`
Then the response SHALL include all sessions with their status, ID, and metadata

#### Scenario: Filter sessions by status
Given sessions with different statuses exist
When a GET request is made to `/sessions?status=active`
Then only sessions with active status SHALL be returned

### Requirement: Session Information Structure
Each session in the list SHALL include essential information for UI display and selection.

#### Scenario: Complete session information
Given a MAS session exists
When the session is included in the list response
Then it SHALL contain sessionId, tmuxSession, status, workingDir, startedAt, agentCount, and httpServerStatus fields

### Requirement: Performance Optimization
The session list endpoint SHALL respond within 500ms even with multiple sessions.

#### Scenario: Response time with multiple sessions
Given 10 or more MAS sessions exist
When a GET request is made to `/sessions`
Then the response time SHALL be less than 500ms

## ADDED Requirements

### Requirement: Pagination Support
The system SHALL support pagination for session lists to handle large numbers of sessions.

#### Scenario: Limit number of returned sessions
Given 100 MAS sessions exist
When a GET request is made to `/sessions?limit=10`
Then only 10 sessions SHALL be returned with a total count of 100