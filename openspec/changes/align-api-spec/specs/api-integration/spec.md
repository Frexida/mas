# API Integration Specification

## ADDED Requirements

### Requirement: Support Official MAS API Endpoints
The application SHALL integrate with the official MAS API at mas-api.frexida.com using the documented endpoints.

#### Scenario: Create new MAS session
GIVEN the user has configured agent prompts
WHEN they submit the configuration
THEN the application sends a POST request to /runs endpoint
AND includes properly structured agents object
AND receives sessionId, tmuxSession, and workingDir in response

#### Scenario: Handle API error responses
GIVEN the API returns an error response
WHEN the status code is 400 or 500
THEN the application displays the error message and code
AND provides actionable feedback to the user

### Requirement: Implement Message Endpoint Support
The application SHALL support sending messages to tmux sessions via the /message endpoint.

#### Scenario: Send message to tmux session
GIVEN a valid tmux session exists
WHEN the user sends a message
THEN the application posts to /message endpoint
AND includes target and message fields
AND handles the acknowledgment response

## MODIFIED Requirements

### Requirement: Use Correct API Base URL
The default API URL SHALL be mas-api.frexida.com instead of tmp.frexida.com.

#### Scenario: Default API configuration
GIVEN no custom API URL is configured
WHEN the application loads
THEN it uses https://mas-api.frexida.com as the base URL
AND all API requests go to the correct domain

### Requirement: Validate API Requests
Request payloads SHALL match the OpenAPI specification constraints.

#### Scenario: Validate agent configuration
GIVEN a user submits agent configuration
WHEN the request is prepared
THEN agent IDs match pattern "\\d{2}"
AND prompts are between 1-5000 characters
AND units array contains 1-4 items
AND each unit has 1-5 workers

## REMOVED Requirements

### Requirement: Remove Configure Endpoint
The /api/agents/configure endpoint SHALL be removed as it doesn't exist in the official API.

#### Scenario: No configure endpoint usage
GIVEN the application needs to create a MAS session
WHEN preparing the API request
THEN it does NOT use /api/agents/configure
AND uses /runs endpoint instead