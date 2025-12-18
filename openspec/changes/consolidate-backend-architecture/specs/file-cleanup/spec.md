# File Cleanup Specification

## REMOVED Requirements

### Legacy Apache Integration
The system SHALL remove all Apache web server integration files as they are no longer used.

#### Scenario: Clean Apache artifacts
GIVEN the system now uses a Node.js API server
WHEN the cleanup is performed
THEN the following files are removed:
  - apache-proxy.conf
  - deploy-to-apache.sh
  - mas-api.service
  - fix-permissions.sh

### Old API Documentation
The system SHALL remove outdated API documentation files that don't reflect the current implementation.

#### Scenario: Remove old API docs
GIVEN the API has been reimplemented with Hono
WHEN the cleanup is performed
THEN the following files are removed:
  - api-docs.html
  - api-redoc.html
  - openapi.yaml
  - openapi.yaml.backup
  - serve_docs.py

### Legacy Script Implementations
The system SHALL remove old shell script implementations that have been replaced.

#### Scenario: Remove replaced scripts
GIVEN mas_refactored.sh is the current implementation
WHEN the cleanup is performed
THEN the following files are removed:
  - mas.sh (after install.sh is updated)
  - mas.sh.backup
  - send_message.sh (after verification of non-use)
  - http_server_fixed.js

### Outdated Documentation
The system SHALL remove documentation that no longer reflects the current system state.

#### Scenario: Remove outdated docs
GIVEN the system architecture has evolved
WHEN the cleanup is performed
THEN the following files are removed:
  - HTTP_SERVER_SETUP.md
  - ISOLATED_SESSIONS.md
  - CI_CD_GUIDE.md
  - buildspec.yml

## MODIFIED Requirements

### Project Root Cleanliness
The project root SHALL contain only essential files and directories.

#### Scenario: Organized project root
GIVEN the cleanup has been performed
WHEN listing the project root directory
THEN it contains only:
  - Essential scripts (mas, mas_refactored.sh, init_unit.sh, install.sh)
  - Core directories (api/, lib/, unit/, workflows/, openspec/, docs/)
  - Project files (README.md, CLAUDE.md, .gitignore, package.json)
  - Version control (.git/)
  - Temporary files in .tmp/ (not tracked)