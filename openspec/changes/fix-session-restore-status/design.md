# Design: Fix Session Restoration Status Validation

## Context
The current session restoration API strictly requires sessions to be in 'terminated' status before allowing restoration. However, sessions can lose their tmux process without being properly marked as terminated, leaving them in an unrestorable state.

## Goals / Non-Goals
### Goals:
- Enable restoration of sessions that have lost their tmux process
- Provide clear feedback when restoration is blocked
- Maintain data consistency between session status and tmux state
- Support force restoration for edge cases

### Non-Goals:
- Changing the fundamental session lifecycle model
- Modifying how sessions are initially created
- Altering tmux session management

## Decisions

### Decision 1: Smart Status Validation
Instead of only allowing 'terminated' status, check actual tmux session existence:
- If status is 'terminated': Allow restoration
- If status is 'inactive' AND tmux doesn't exist: Allow restoration
- If status is 'active' AND tmux doesn't exist: Update to 'terminated' and allow
- Otherwise: Block restoration (or require force flag)

**Alternatives considered:**
- Always sync status before checking: Too expensive, requires tmux query
- Remove status validation entirely: Too permissive, could corrupt active sessions

### Decision 2: Force Restoration Flag
Add optional `force: boolean` parameter to bypass validation:
- Useful for recovering from inconsistent states
- Admin/power-user feature for edge cases
- Still validates session existence in index

**Alternatives considered:**
- Separate admin endpoint: Over-engineering for rare use case
- No force option: Users stuck with corrupted sessions

## Risks / Trade-offs
- **Risk**: Force restoration could overwrite active sessions
  - **Mitigation**: Clear warnings in API response and documentation
- **Risk**: Status inconsistency during concurrent operations
  - **Mitigation**: Use locking mechanism during restoration

## Migration Plan
1. Deploy updated API with backward compatibility
2. Existing restoration attempts will work as before
3. New logic only activates for previously-blocked cases
4. No data migration needed

## Open Questions
- Should we auto-sync session status periodically in background?
- Should force restoration require elevated permissions?