# Enhance Message API with Required Session Support

## Summary
Extend the Message API to require a session ID parameter, ensuring messages are always routed to the correct tmux session. Update WebUI to include session ID from the existing session creation response.

## Problem
Currently, the Message API auto-detects sessions which is unreliable when multiple sessions exist. The WebUI already receives session information (Session ID, Tmux Session name) when creating sessions but doesn't use it when sending messages, causing messages to be sent to wrong sessions.

## Solution
- Add required `session` field to Message API request schema
- Implement session validation and routing logic
- Use existing session information from WebUI (Session ID: `fd5dfb9b-7c4d-4309-ab68-1971f275ff86`, Tmux Session: `mas-fd5dfb9b`)
- Store session information in WebUI state after session creation
- Include stored session ID in all message requests

## Impact
- **API Changes**: Required session parameter (breaking change for direct API users, but WebUI already has this information)
- **WebUI Changes**: Utilize existing session information from session creation response
- **Backend Changes**: Simplified routing logic (no auto-detection needed)
- **User Experience**: Guaranteed correct message routing

## Risks
- Session IDs might change between API calls
- Invalid session IDs need proper error handling
- UI complexity increases with session management

## Alternatives Considered
1. **Session pinning via cookies**: Rejected - less flexible for multi-session scenarios
2. **Separate endpoints per session**: Rejected - increases API surface unnecessarily
3. **WebSocket with session binding**: Rejected - overkill for current use case