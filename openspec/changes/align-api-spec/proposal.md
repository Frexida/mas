# Align API Integration with Official MAS Specification

## Summary
Align the MAS-UI application with the official MAS API specification documented at https://mtdnot.dev/mas/api-docs/. The current implementation uses incorrect endpoints and data structures that don't match the official API.

## Motivation
The current implementation is using a non-existent `/api/agents/configure` endpoint with an incompatible data structure. The official API provides `/runs` and `/message` endpoints with different request/response schemas. This misalignment prevents proper integration with the MAS backend system.

## Current Behavior
- API URL: Incorrectly defaults to `tmp.frexida.com` instead of `mas-api.frexida.com`
- Endpoint: Uses `/api/agents/configure` which doesn't exist
- Request structure: Uses `units` and `units_data` fields
- Response expectation: Expects file array instead of session information

## Proposed Changes
1. Update API base URL to use `mas-api.frexida.com` as the default
2. Replace `/api/agents/configure` with `/runs` endpoint
3. Restructure request payload to match OpenAPI specification
4. Update response handling to process session information
5. Add support for `/message` endpoint for tmux session communication
6. Update TypeScript types to match official API schemas

## Impact Analysis
- **Breaking Change**: Yes - API integration will completely change
- **User Impact**: Users will need to reconfigure their API settings
- **Data Migration**: LocalStorage API configuration will be reset to new defaults
- **Testing Requirements**: Full API integration testing required

## Success Criteria
- Application successfully creates MAS sessions via `/runs` endpoint
- Response correctly displays sessionId, tmuxSession, and workingDir
- API URL defaults to `mas-api.frexida.com`
- Request validation matches OpenAPI specification requirements
- Error handling properly displays API error responses