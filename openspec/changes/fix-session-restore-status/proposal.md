# Change: Fix session restoration for non-terminated sessions

## Why
Sessions that lose their tmux process but aren't marked as "terminated" cannot be restored, preventing users from recovering sessions after crashes or unexpected terminations.

## What Changes
- Allow restoration of sessions in 'inactive' state when tmux session doesn't exist
- Add force restoration option to handle edge cases
- Improve error messages to guide users when restoration is blocked
- **BREAKING**: Changes restoration validation logic (more permissive)

## Impact
- Affected specs: session-restoration
- Affected code: api/utils/session-manager.ts, api/routes/sessions.ts