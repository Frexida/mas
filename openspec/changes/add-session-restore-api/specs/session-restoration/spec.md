# Session Restoration Capability

## ADDED Requirements

### REQ-001: Session Restore API Endpoint
The system SHALL provide a REST API endpoint to restore terminated sessions.

#### Scenario: Restore a terminated session via API
GIVEN a terminated session with ID "abc123"
WHEN a POST request is made to `/sessions/abc123/restore`
THEN the tmux session "mas-abc123" is created with 6 windows
AND the session status changes from "terminated" to "inactive"
AND a success response is returned with session details

#### Scenario: Restore with agent startup option
GIVEN a terminated session with ID "def456"
WHEN a POST request is made to `/sessions/def456/restore` with `{"startAgents": true}`
THEN the session is restored with all windows and panes
AND agents are automatically started in their designated panes
AND the response indicates agents were started

### REQ-002: Session State Validation
The system SHALL validate session state before restoration.

#### Scenario: Prevent restoration of active sessions
GIVEN an active session with ID "xyz789"
WHEN a POST request is made to `/sessions/xyz789/restore`
THEN the request is rejected with status 400
AND an error message indicates the session is not terminated

#### Scenario: Handle non-existent sessions
GIVEN a session ID "nonexist" that doesn't exist in the index
WHEN a POST request is made to `/sessions/nonexist/restore`
THEN the request is rejected with status 404
AND an error message indicates the session was not found

### REQ-003: Session Structure Preservation
The system SHALL restore sessions with their original structure.

#### Scenario: Restore complete window layout
GIVEN a terminated session that originally had the standard 6-window layout
WHEN the session is restored via the API
THEN the tmux session has windows: meta, design, development, business, terminal, logs
AND design, development, and business windows each have 4 panes in 2x2 layout
AND all environment variables are set correctly in each pane

### REQ-004: Error Recovery and Rollback
The system SHALL handle restoration failures gracefully.

#### Scenario: Handle tmux creation failure
GIVEN a terminated session with corrupted metadata
WHEN restoration is attempted and tmux creation fails
THEN any partially created resources are cleaned up
AND the session status remains "terminated"
AND a detailed error response is returned

#### Scenario: Handle concurrent restoration attempts
GIVEN a terminated session being restored by one request
WHEN another restoration request arrives for the same session
THEN the second request is rejected with status 409
AND an error indicates restoration is already in progress

## MODIFIED Requirements

### REQ-005: Session Status Updates
The session index SHALL accurately reflect restoration state changes.

#### Scenario: Update session index after successful restoration
GIVEN a session index with a terminated session entry
WHEN the session is successfully restored
THEN the index is updated with the new status "inactive"
AND the lastUpdated timestamp is refreshed
AND the change is persisted to disk

### REQ-006: Session Listing Enhancement
The session listing endpoint SHALL include restoration eligibility.

#### Scenario: Indicate restorable sessions
GIVEN a list of sessions with various statuses
WHEN the sessions are retrieved via GET /sessions
THEN each session object includes a "restorable" boolean field
AND terminated sessions have "restorable": true
AND active/inactive sessions have "restorable": false