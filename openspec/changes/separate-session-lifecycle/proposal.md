# Separate Session Lifecycle Management

## Summary
Separate the concerns of infrastructure startup (API/WebUI) from session/agent lifecycle management. Currently, `mas start` conflates these responsibilities, leading to confusion about when agents should be created.

## Problem Statement
The current implementation has overlapping and conflicting behaviors:
1. `mas start` creates tmux sessions and starts agents immediately
2. `/runs` endpoint also calls `mas start --config` to create sessions
3. This creates duplicate agent initialization when using WebUI
4. The separation of concerns between infrastructure and runtime is unclear

## Proposed Solution
Create clear separation between:
- **Infrastructure layer**: API server and WebUI (stateless services)
- **Session layer**: tmux sessions and agent processes (stateful runtime)

### Key Changes
1. `mas start` becomes infrastructure-only (starts API and WebUI)
2. New `mas session` command for CLI-based session management
3. `/runs` endpoint creates sessions directly without calling `mas start`
4. WebUI becomes the primary interface for session lifecycle management

## Benefits
- Clear separation of concerns
- No duplicate agent initialization
- WebUI can manage multiple sessions independently
- CLI and API have consistent, non-overlapping behaviors
- Better alignment with microservices architecture patterns

## Risks & Mitigations
- **Risk**: Breaking change for existing users
  - **Mitigation**: Provide migration guide and deprecation warnings
- **Risk**: CLI users lose direct session creation
  - **Mitigation**: New `mas session` command provides equivalent functionality

## Success Criteria
- WebUI can create/manage sessions without CLI interference
- API endpoints are self-contained (don't shell out to CLI)
- Clear documentation of each component's responsibilities
- No duplicate agent initialization paths