# Backend Integration Specification

## ADDED Requirements

### Shell Script Module Documentation
The system SHALL provide documentation for all shell script modules explaining their purpose and interfaces.

#### Scenario: Developer understands shell modules
GIVEN a developer needs to modify shell scripts
WHEN they read docs/SHELL_MODULES.md
THEN they find documentation for:
  - agent.sh - Agent lifecycle management
  - message.sh - Message routing and delivery
  - session.sh - Session management and persistence
  - tmux.sh - tmux window and pane operations
  - agent_init.sh - Agent environment initialization

### API Server Documentation
The API server SHALL have comprehensive documentation in its own directory.

#### Scenario: API server setup and operation
GIVEN a developer needs to work with the API server
WHEN they read api/README.md
THEN they find:
  - Setup instructions
  - Development workflow
  - Testing procedures
  - Deployment guidelines
  - Environment variables
  - Dependencies

## MODIFIED Requirements

### Backend Layer Communication
The communication between backend layers SHALL be clearly documented and follow established patterns.

#### Scenario: API calls shell script
GIVEN the API needs to send a message
WHEN it processes a POST /message request
THEN it:
  1. Validates the session exists
  2. Sets MAS_SESSION_NAME environment variable
  3. Executes mas send command with parameters
  4. Returns the execution result as JSON

#### Scenario: Shell script provides functionality
GIVEN mas send receives a message request
WHEN it processes the command
THEN it:
  1. Detects the current tmux session (if in tmux)
  2. Uses MAS_SESSION_NAME (if provided)
  3. Falls back to find_active_session
  4. Routes message through lib/message.sh
  5. Delivers via tmux send-keys

### System Integration Testing
The system SHALL maintain integration tests that verify all layers work together correctly.

#### Scenario: End-to-end message delivery
GIVEN a test sends a message via API
WHEN the message is processed
THEN:
  - API validates and accepts the request
  - Shell script routes to correct session
  - Message appears in target agent's pane
  - API returns success response