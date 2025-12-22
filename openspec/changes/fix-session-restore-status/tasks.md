# Implementation Tasks

## 1. Core Logic Updates
- [x] 1.1 Update session restoration validation in `api/utils/session-manager.ts`
  - Allow restoration when status is 'inactive' AND tmux session doesn't exist
  - Allow restoration when status is 'terminated'
- [x] 1.2 Add force restoration option
  - Add `force` parameter to RestoreRequest type
  - Skip status validation when force=true
- [x] 1.3 Improve tmux session existence check
  - Verify tmux session actually exists before blocking restoration
  - Update status to 'terminated' if tmux session is missing

## 2. Error Handling Improvements
- [x] 2.1 Provide detailed error messages
  - Specify current session status in error
  - Suggest using force option when appropriate
- [x] 2.2 Add pre-restoration validation
  - Check if tmux session truly exists
  - Update session status if inconsistent

## 3. API Updates
- [x] 3.1 Update restore endpoint validation
  - Accept force parameter
  - Return helpful error details
- [ ] 3.2 Update API documentation
  - Document force parameter
  - Document new restoration rules

## 4. Frontend Updates (Optional)
- [ ] 4.1 Show force restore option for stuck sessions
- [ ] 4.2 Display clearer error messages
- [ ] 4.3 Auto-detect restorable sessions regardless of status

## 5. Testing
- [x] 5.1 Test restoration of inactive sessions without tmux
- [x] 5.2 Test force restoration option
- [x] 5.3 Test status synchronization logic