# Add Session Restore API

## Summary
Add a REST API endpoint to restore terminated MAS sessions, enabling users to recover and reactivate sessions that have been stopped or lost due to system restarts.

## Problem Statement
Currently, the MAS API provides endpoints to list, connect to, and stop sessions, but lacks the ability to restore terminated sessions. While a shell command `mas session restore` exists, there's no corresponding API endpoint. This creates a gap in functionality for web UI users and API consumers who need to recover terminated sessions.

## Proposed Solution
Implement a new POST endpoint `/sessions/:sessionId/restore` that:
1. Validates the session exists and is in terminated state
2. Recreates the tmux session with original structure (6 windows)
3. Restores environment variables and working directories
4. Optionally starts agents if requested
5. Updates session index to reflect the restored state

## User Impact
- **Web UI users** can restore terminated sessions directly from the interface
- **API consumers** gain programmatic session recovery capabilities
- **System administrators** can automate session recovery after system restarts

## Technical Scope
- Add new endpoint in `api/routes/sessions.ts`
- Implement restoration logic in `api/utils/session-manager.ts`
- Reuse existing shell restoration logic from `lib/session-restore.sh`
- Add appropriate validators and types

## Success Criteria
- Terminated sessions can be restored via API call
- Restored sessions have identical structure to original (6 windows, proper pane layout)
- Session status correctly updates from "terminated" to "inactive/active"
- Error handling for invalid session IDs and non-terminated sessions
- Optional agent startup works correctly when requested