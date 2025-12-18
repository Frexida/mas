# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OSS naming conventions with `mas-` prefix for all modules
- Comprehensive API documentation in `api/README.md`
- Architecture documentation in `docs/ARCHITECTURE.md`
- Shell module documentation in `docs/SHELL_MODULES.md`
- Examples directory with sample configurations
- Tests directory structure
- LICENSE, CONTRIBUTING.md, and CODE_OF_CONDUCT.md files
- Scripts directory for installation and utility scripts
- Session ID requirement for message API
- Automatic session detection from current tmux session
- Default auto-execute behavior for `mas send` command
- Agent initialization with mas command support
- WebUI integration support

### Changed
- Renamed `mas_refactored.sh` to `mas-core.sh`
- Renamed all lib modules with `mas-` prefix
- Updated all environment variables to use `MAS_` prefix
- Moved installation scripts to `scripts/` directory
- Moved documentation to `docs/` directory
- Changed default execute behavior from false to true
- Updated message API to require session parameter
- Improved session detection with priority: current tmux > MAS_SESSION_NAME > find_active

### Removed
- Legacy mode support
- Apache configuration files
- Old API documentation files
- CI/CD configuration files
- Deprecated shell scripts

### Fixed
- Message routing to correct tmux sessions
- Session detection in attached tmux sessions
- Double message sending issue
- Agent access to mas command
- Git index corruption during commits

## [1.0.0] - 2024-12-18

### Added
- Initial release with multi-agent system support
- 13 AI agents organized in 4 units
- Hono-based API server
- tmux session management
- Message routing system
- Modular shell script architecture
- WebUI integration
- OpenSpec change management system

### Features
- Meta Manager for overall coordination
- Design Unit (Manager + 3 workers)
- Development Unit (Manager + 3 workers)
- Business Unit (Manager + 3 workers)
- Real-time message distribution
- Session isolation
- Workspace management
- API-driven communication

[Unreleased]: https://github.com/mas-project/mas/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/mas-project/mas/releases/tag/v1.0.0