# Session Management Specification

## ADDED Requirements

### Requirement: New mas session command for CLI session management
A new `mas session` command SHALL provide complete session lifecycle management from the CLI.

#### Scenario: Create session via CLI
Given the infrastructure is running
When the user executes `mas session create`
Then a new tmux session is created with pattern mas-*
And agent processes are started in the session
And the session ID is displayed to the user

#### Scenario: Create session with configuration
Given the infrastructure is running
And a valid config.json file exists
When the user executes `mas session create --config config.json`
Then a new session is created with the specified configuration
And agents are initialized with prompts from the config

#### Scenario: List active sessions
Given multiple sessions are running
When the user executes `mas session list`
Then all active sessions are displayed with their IDs and status
And the output includes creation time and agent count

### Requirement: API creates sessions without CLI dependency
The `/runs` endpoint SHALL create sessions directly without calling CLI commands.

#### Scenario: WebUI creates session via API
Given the infrastructure is running
When the WebUI sends POST /runs with agent configuration
Then the API creates a tmux session using Node.js child_process
And returns session details in the response
And does not execute any `mas` CLI commands

#### Scenario: Concurrent session creation
Given the infrastructure is running
When multiple POST /runs requests are sent simultaneously
Then each request creates a separate session
And no race conditions or conflicts occur
And all sessions are properly tracked

### Requirement: Session cleanup and state management
The system SHALL properly track and clean up session resources.

#### Scenario: Stop session via API
Given an active session exists
When POST /sessions/{id}/stop is called
Then the tmux session is terminated
And all agent processes are stopped
And the session state is updated to "terminated"

#### Scenario: Orphan detection on restart
Given sessions were running when API crashed
When the API server restarts
Then it detects existing tmux sessions
And updates their state in the session list
And allows management of recovered sessions