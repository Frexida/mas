# WebUI Session Management Specification

## ADDED Requirements

### Requirement: Session Information Storage
The WebUI SHALL store session information received from the session creation response.

#### Scenario: Store session after creation
Given a successful session creation response containing:
- Session ID: "fd5dfb9b-7c4d-4309-ab68-1971f275ff86"
- Tmux Session: "mas-fd5dfb9b"
- Working Directory and Started At timestamp
When the response is received
Then the WebUI SHALL store the tmux session ID ("mas-fd5dfb9b") in state
And use it for all subsequent message requests

### Requirement: Session Display
The WebUI SHALL display the current session information prominently.

#### Scenario: Show current session information
Given a session "mas-fd5dfb9b" is stored in state
When the WebUI displays the message interface
Then it SHALL show:
- Current Session: mas-fd5dfb9b
- Session ID: fd5dfb9b-7c4d-4309-ab68-1971f275ff86
- Started: 2025/12/18 11:26:19

## ADDED Requirements (Message Sending)

### Requirement: Include Session in Message Requests
The WebUI SHALL include the stored session ID in all message requests.

#### Scenario: Send message with stored session
Given a session "mas-fd5dfb9b" is stored from session creation
When the user sends a message
Then the POST request to /message SHALL include:
```json
{
  "target": "agent-10",
  "message": "Hello",
  "session": "mas-fd5dfb9b"
}
```

#### Scenario: No message without session
Given no session information is stored
When the user attempts to send a message
Then the WebUI SHALL display an error
And prompt the user to create a session first

### Requirement: Session Error Handling
The WebUI SHALL gracefully handle session-related errors.

#### Scenario: Handle invalid session error
Given a selected session becomes invalid
When a message send fails with SESSION_NOT_FOUND
Then the WebUI SHALL display an error message
And prompt the user to select a different session
And refresh the session list

#### Scenario: Handle no sessions available
Given no sessions are available
When the user attempts to send a message
Then the WebUI SHALL display a warning
And provide instructions to start a MAS session

## ADDED Requirements (UI Layout)

### Requirement: Session Information Display
The session information SHALL be displayed prominently in the UI.

#### Scenario: Display session info
Given a session is active
When the message sending form is displayed
Then the UI SHALL show:
- Current Session ID (e.g., "mas-fd5dfb9b")
- Full Session UUID
- Session creation timestamp
And this information SHALL be always visible

### Requirement: Persistent Session State
The WebUI SHALL maintain session state throughout the browser session.

#### Scenario: Maintain session across interactions
Given a session "mas-fd5dfb9b" was created
When the user performs multiple actions
Then the session SHALL remain in state
Until the browser is refreshed or session is explicitly terminated