# UI Components Specification

## ADDED Requirements

### Requirement: Display Session Information
UI SHALL display session details from /runs response prominently.

#### Scenario: Show session identifiers
GIVEN a successful /runs API response
WHEN displaying the result
THEN show sessionId as a UUID
AND display tmuxSession name
AND show workingDir path
AND format startedAt timestamp readably

#### Scenario: Copy session details
GIVEN session information is displayed
WHEN user clicks copy button
THEN sessionId is copied to clipboard
AND user receives confirmation feedback

### Requirement: Message Sending Interface
UI SHALL provide interface for sending messages to tmux sessions.

#### Scenario: Message input form
GIVEN an active session exists
WHEN user wants to send a message
THEN provide target selection dropdown
AND message input field
AND execute checkbox option
AND send button triggers /message API

## MODIFIED Requirements

### Requirement: Update Configuration Display
Configuration form SHALL match new API structure requirements.

#### Scenario: Agent ID validation
GIVEN user enters agent ID
WHEN validating input
THEN only accept 2-digit numeric strings
AND show error for invalid patterns
AND highlight format requirement

#### Scenario: Prompt length validation
GIVEN user enters agent prompt
WHEN checking constraints
THEN enforce 1-5000 character limit
AND show character count
AND prevent submission if over limit

### Requirement: Fix API Settings Component
Settings component SHALL use correct default URL.

#### Scenario: Default URL selection
GIVEN the API settings modal opens
WHEN showing preset options
THEN "Production (mas-api.frexida.com)" is first option
AND it uses https://mas-api.frexida.com as value
AND removes tmp.frexida.com reference

## REMOVED Requirements

### Requirement: Remove File Display Components
File array display SHALL be removed as response structure changed.

#### Scenario: No file display
GIVEN API response is received
WHEN displaying results
THEN do NOT show file list
AND do NOT render file content viewers
AND show session information instead

### Requirement: Remove Configure Endpoint References
UI SHALL not reference the deprecated configure endpoint.

#### Scenario: API endpoint display
GIVEN the header shows connection status
WHEN displaying API endpoint
THEN show "/runs" not "/api/agents/configure"
AND update any endpoint documentation in UI