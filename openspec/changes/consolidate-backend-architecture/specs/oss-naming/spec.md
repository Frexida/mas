# OSS Naming Standards Specification

## ADDED Requirements

### Project Naming Standards
The system SHALL adopt consistent naming conventions suitable for an open source project.

#### Scenario: Developer discovers the project
GIVEN a developer is searching for multi-agent systems
WHEN they find the MAS project
THEN they see:
  - Clear, professional project name (MAS - Multi-Agent System)
  - Consistent naming across all components
  - Descriptive file and directory names
  - Standard OSS directory structure

### Command Line Interface Naming
The CLI SHALL use a short, memorable command name that doesn't conflict with existing tools.

#### Scenario: User installs and uses MAS
GIVEN a user installs MAS globally
WHEN they type `mas` in the terminal
THEN the command:
  - Is easy to type and remember
  - Doesn't conflict with existing commands
  - Follows Unix naming conventions (lowercase, no special characters)
  - Has consistent subcommands (mas start, mas send, mas stop)

### Module Naming Convention
All shell script modules SHALL use consistent `mas-` prefix for clarity and namespace isolation.

#### Scenario: Developer navigates codebase
GIVEN a developer explores the lib/ directory
WHEN they list the files
THEN they see:
  - mas-agent.sh (not agent.sh)
  - mas-message.sh (not message.sh)
  - mas-session.sh (not session.sh)
  - mas-tmux.sh (not tmux.sh)
  Making it clear these are MAS-specific modules

### API Versioning
The API SHALL include version information in the URL path for future compatibility.

#### Scenario: API client makes requests
GIVEN an external tool integrates with MAS API
WHEN it makes HTTP requests
THEN it uses versioned endpoints:
  - /api/v1/health
  - /api/v1/sessions
  - /api/v1/messages
  Allowing for future API evolution without breaking changes

### Environment Variable Namespace
All environment variables SHALL use the `MAS_` prefix to avoid conflicts.

#### Scenario: User configures MAS
GIVEN a user sets environment variables
WHEN they configure MAS
THEN they use:
  - MAS_HOME (not HOME or PROJECT_HOME)
  - MAS_API_PORT (not API_PORT or PORT)
  - MAS_SESSION_NAME (not SESSION or SESSION_NAME)
  Preventing conflicts with other tools

## MODIFIED Requirements

### File Renaming Plan
Existing files SHALL be renamed to follow OSS conventions during consolidation.

#### Scenario: Rename implementation files
GIVEN the consolidation is performed
WHEN files are reorganized
THEN the following renames occur:
  - mas_refactored.sh → mas-core.sh
  - init_unit.sh → scripts/init.sh
  - install.sh → scripts/install.sh
  - agent.sh → mas-agent.sh
  - message.sh → mas-message.sh
  - session.sh → mas-session.sh
  - tmux.sh → mas-tmux.sh

### Repository Structure
The repository SHALL follow standard OSS project structure conventions.

#### Scenario: New contributor explores repository
GIVEN a new contributor clones the repository
WHEN they explore the structure
THEN they find familiar patterns:
  - /api - API server code
  - /lib - Core libraries
  - /scripts - Utility scripts
  - /docs - Documentation
  - /tests - Test suites
  - /examples - Usage examples
  - README.md - Project overview
  - LICENSE - OSS license
  - CONTRIBUTING.md - Contribution guidelines