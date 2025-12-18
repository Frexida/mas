# Implementation Tasks

## Phase 1: Type System Updates
- [x] Create new `types/masApi.ts` with OpenAPI-compliant types
  - Define Agent, Unit, RunsRequest, RunsResponse interfaces
  - Add MessageRequest and MessageResponse types
  - Include proper validation constraints in JSDoc comments
- [x] Add type validation utilities for agent ID pattern and prompt length
- [x] Create migration mapping from old types to new types

## Phase 2: API Service Implementation
- [x] Create `services/masApi.ts` with new endpoint functions
  - Implement `createRun(request: RunsRequest): Promise<RunsResponse>`
  - Implement `sendMessage(request: MessageRequest): Promise<MessageResponse>`
  - Add proper error handling for 400/500 responses
- [x] Update `services/apiConfig.ts` to use mas-api.frexida.com as default
  - Change DEFAULT_CONFIG baseUrl
  - Update PRESET_URLS to include correct production URL
  - Add migration logic for old localStorage data

## Phase 3: UI Component Updates
- [x] Create `components/SessionDisplay.tsx` for showing session information
  - Display sessionId, tmuxSession, workingDir
  - Add copy-to-clipboard functionality
  - Format timestamps properly
- [x] Update `components/AgentConfigurator.tsx` for new data structure
  - Change form structure to match agents object format
  - Add unitId field to each unit
  - Update validation for 2-digit agent IDs
  - Add character counter for prompts
- [x] Modify `components/OutputDisplay.tsx` to show session info
  - Remove file display logic
  - Add session information cards
  - Include message sending interface

## Phase 4: Integration and Migration
- [x] Update `App.tsx` to use new API service
  - Import masApi instead of api
  - Update state types to RunsResponse
  - Handle new response structure
- [x] Implement localStorage migration on app load
  - Detect old API configuration format
  - Auto-migrate to new structure
  - Clear invalid cached data
- [x] Update `components/ApiSettings.tsx`
  - Change default URL display
  - Update preset options
  - Add API version indicator

## Phase 5: Validation and Testing
- [x] Add input validation for all form fields
  - Agent ID pattern validation (\\d{2})
  - Prompt length validation (1-5000 chars)
  - Unit count validation (1-4)
  - Worker count validation (1-5 per unit)
- [x] Implement API health check on startup
  - Test connection to mas-api.frexida.com
  - Display connection status in header
  - Show error banner if API unreachable
- [x] Add comprehensive error handling
  - Parse and display API error responses
  - Show field-specific validation errors
  - Implement retry mechanism with backoff

## Phase 6: Cleanup
- [ ] Remove deprecated `services/api.ts`
- [ ] Delete old type definitions from `types/agent.ts`
- [ ] Remove file display related components
- [ ] Update all imports throughout codebase
- [ ] Clean up unused dependencies

## Validation Steps
- [x] Test creating MAS session with various configurations
- [x] Verify session information displays correctly
- [x] Test error handling for invalid inputs
- [x] Confirm localStorage migration works
- [x] Validate API settings update properly
- [x] Test message sending functionality
- [x] Verify all validations match OpenAPI spec