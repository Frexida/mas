# Session Workspace Isolation

## ADDED Requirements

### Requirement: Session workspace directory structure
The system SHALL create an isolated workspace directory for each session using the session's UUID as the directory name.

#### Scenario: Creating a new session workspace
GIVEN a new session with UUID "550e8400-e29b-41d4-a716-446655440000"
WHEN the session is initialized in isolated mode
THEN a directory "sessions/550e8400-e29b-41d4-a716-446655440000/" SHALL be created
AND the directory SHALL contain subdirectories: "unit/", "workflows/", "logs/"
AND a ".session" metadata file SHALL be created in the directory
AND a "config.json" file SHALL be saved with the session configuration

### Requirement: Template copying during initialization
The system SHALL copy unit and workflow templates from the master directories to the session workspace during initialization.

#### Scenario: Initializing session units from templates
GIVEN a session workspace at "sessions/{uuid}/"
AND template units exist in "unit/" directory
WHEN the session is initialized
THEN all unit directories (00, 10-13, 20-23, 30-33) SHALL be copied to "sessions/{uuid}/unit/"
AND all workflow files SHALL be copied to "sessions/{uuid}/workflows/"
AND the copied files SHALL be writable by the session

### Requirement: Session metadata format
The system SHALL store session metadata in a shell-compatible key-value format in the ".session" file.

#### Scenario: Reading session metadata
GIVEN a session with ID "550e8400-e29b-41d4-a716-446655440000"
AND a ".session" file exists in the session directory
WHEN the session metadata is loaded
THEN the file SHALL contain at minimum:
  - SESSION_ID={full-uuid}
  - TMUX_SESSION={tmux-session-name}
  - STATUS={active|stopped|error}
  - CREATED_AT={ISO-8601-timestamp}
  - UNIT_DIR={absolute-path-to-session-unit-dir}
  - WORKFLOWS_DIR={absolute-path-to-session-workflows-dir}

### Requirement: Session-specific working directories
Each agent in an isolated session SHALL use the session-specific unit directory as its working directory.

#### Scenario: Agent working directory configuration
GIVEN a session in isolated mode with workspace at "sessions/{uuid}/"
WHEN agent "00" is started
THEN the agent's working directory SHALL be "sessions/{uuid}/unit/00/"
AND any files created by the agent SHALL be stored within this directory
AND the agent SHALL NOT have write access to the template directories

## MODIFIED Requirements

### Requirement: Session naming convention
The tmux session name SHALL include a UUID prefix when running in isolated mode.

#### Scenario: Generating tmux session name in isolated mode
GIVEN a session UUID "550e8400-e29b-41d4-a716-446655440000"
AND the system is running in isolated mode
WHEN the tmux session is created
THEN the session name SHALL be "mas-550e8400"
AND this name SHALL be stored in the TMUX_SESSION field of the metadata

#### Scenario: Legacy mode session naming
GIVEN the system is running in legacy mode
WHEN a tmux session is created
THEN the session name SHALL follow the existing convention "mas-tmux" or "mas-{project-name}"
AND no UUID prefix SHALL be added

### Requirement: Unit directory resolution
The system SHALL resolve unit directories based on the session mode.

#### Scenario: Unit directory in isolated mode
GIVEN a session in isolated mode with ID "550e8400-e29b-41d4-a716-446655440000"
WHEN the unit directory is resolved
THEN it SHALL return "sessions/550e8400-e29b-41d4-a716-446655440000/unit/"

#### Scenario: Unit directory in legacy mode
GIVEN a session in legacy mode
WHEN the unit directory is resolved
THEN it SHALL return the default "unit/" directory in the MAS root