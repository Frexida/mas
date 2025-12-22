## MODIFIED Requirements

### Requirement: Session Restoration Validation
The system SHALL allow restoration of sessions that are marked as terminated OR sessions where the underlying tmux session no longer exists, regardless of the recorded status.

#### Scenario: Restore terminated session
- **GIVEN** a session with status "terminated"
- **WHEN** POST request is made to `/sessions/:id/restore`
- **THEN** restoration proceeds successfully

#### Scenario: Restore inactive session without tmux
- **GIVEN** a session with status "inactive"
- **AND** the corresponding tmux session does not exist
- **WHEN** POST request is made to `/sessions/:id/restore`
- **THEN** restoration proceeds successfully
- **AND** session status is updated appropriately

#### Scenario: Restore with force flag
- **GIVEN** a session in any status
- **WHEN** POST request is made to `/sessions/:id/restore` with `{"force": true}`
- **THEN** restoration proceeds regardless of status
- **AND** any existing tmux session is replaced

#### Scenario: Block restoration of active session
- **GIVEN** a session with status "active" or "inactive"
- **AND** the corresponding tmux session exists
- **AND** force flag is not set
- **WHEN** POST request is made to `/sessions/:id/restore`
- **THEN** return 400 error with message explaining the session is still active
- **AND** suggest using force flag if restoration is truly needed

## ADDED Requirements

### Requirement: Force Restoration Option
The system SHALL provide a force restoration option that bypasses normal validation checks for recovering corrupted or stuck sessions.

#### Scenario: Force restore over existing session
- **GIVEN** a session with an existing tmux process
- **WHEN** POST request is made with `{"force": true}`
- **THEN** existing tmux session is terminated
- **AND** new session is created with same ID
- **AND** warning is included in response about forced restoration

### Requirement: Automatic Status Synchronization
The system SHALL automatically correct session status when detecting inconsistencies during restoration attempts.

#### Scenario: Auto-correct terminated status
- **GIVEN** a session marked as "active" or "inactive"
- **AND** tmux session doesn't exist
- **WHEN** restoration is attempted
- **THEN** status is updated to "terminated"
- **AND** restoration proceeds normally

#### Scenario: Detect orphaned sessions
- **GIVEN** a session in the index
- **AND** no corresponding tmux session exists
- **WHEN** session details are queried
- **THEN** restorable field shows true
- **AND** appropriate status is reflected