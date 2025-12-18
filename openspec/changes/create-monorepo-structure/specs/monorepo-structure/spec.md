# Monorepo Structure Specification

## ADDED Requirements

### Requirement: Unified Installation
The system MUST provide a single installation command that sets up both frontend and backend dependencies.

#### Scenario: Fresh Installation
Given a fresh clone of the repository
When a developer runs `npm install` in the root directory
Then all dependencies for web/, api/, and root packages are installed
And the system is ready to start without additional setup

### Requirement: Single-Command Startup
The system MUST allow starting all components with one command.

#### Scenario: Development Environment Startup
Given the system is installed
When a developer runs `npm start` in the root directory
Then the MAS session is started or attached
And the API server starts on port 8765
And the web development server starts on port 5173
And all components can communicate with each other

### Requirement: Workspace Isolation
Each workspace MUST maintain its own dependencies and configuration.

#### Scenario: Independent Package Management
Given the monorepo structure with web/ and api/ workspaces
When dependencies are updated in one workspace
Then other workspaces remain unaffected
And each workspace can have different versions of the same package

## MODIFIED Requirements

### Requirement: Repository Structure
The repository structure MUST be organized as a monorepo with clear separation of concerns.

#### Scenario: Directory Organization
Given the monorepo structure
When navigating the repository
Then frontend code is located in web/
And backend code is located in api/
And shared scripts are in scripts/
And documentation is properly organized in docs/

### Requirement: Package Naming
All packages MUST follow a consistent naming convention.

#### Scenario: Package Identification
Given the workspace packages
When examining package.json files
Then the API package is named "@mas/api"
And the web package is named "@mas/web"
And the root package is named "mas"

## REMOVED Requirements

### Requirement: Separate Repository Management
The system will NO LONGER require separate repository clones for frontend and backend.

#### Scenario: Unified Development
Given the monorepo structure
When developing features
Then both frontend and backend changes can be in the same PR
And version management is unified
And deployment can be coordinated