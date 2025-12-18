# Infrastructure Startup Specification

## MODIFIED Requirements

### Requirement: mas start launches only infrastructure services
The `mas start` command SHALL start only the API server and WebUI, without creating any tmux sessions or agent processes.

#### Scenario: User starts infrastructure
Given a clean system state
When the user executes `mas start`
Then the API server starts on port 8765
And the WebUI starts on port 5173
And no tmux sessions are created
And no agent processes are launched

#### Scenario: Infrastructure health check
Given the infrastructure is started with `mas start`
When the user accesses http://localhost:8765/health
Then the API returns {"status": "ok"}
And the WebUI is accessible at http://localhost:5173

## REMOVED Requirements

### Requirement: Remove session-related options from mas start
The `mas start` command SHALL NOT accept `--config`, `--skip-init`, or `--no-attach` options.

#### Scenario: Deprecated option usage
Given the infrastructure is not running
When the user executes `mas start --config config.json`
Then the command displays a deprecation warning
And suggests using `mas session create --config config.json` instead
And starts only the infrastructure services

### Requirement: Remove agent initialization from mas start
The `mas start` command SHALL NOT initialize any agents or create tmux windows.

#### Scenario: No automatic agent startup
Given the infrastructure is started with `mas start`
When the startup completes
Then `tmux ls` shows no mas-* sessions
And no agent processes are running
And the API is ready to receive session creation requests