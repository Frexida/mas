# Type System Specification

## ADDED Requirements

### Requirement: Define OpenAPI-Compliant Types
TypeScript interfaces SHALL match the OpenAPI schema definitions exactly.

#### Scenario: Agent type definition
GIVEN the OpenAPI defines Agent structure
WHEN defining TypeScript types
THEN Agent interface has id (string) and prompt (string) fields
AND id follows "\\d{2}" pattern validation
AND prompt has 1-5000 character length validation

#### Scenario: RunsResponse type
GIVEN the API returns session information
WHEN defining response types
THEN RunsResponse includes sessionId (UUID), tmuxSession, workingDir, startedAt
AND all fields are properly typed as strings

### Requirement: Add Message Types
Types for the /message endpoint SHALL be defined.

#### Scenario: Message request type
GIVEN the need to send messages to tmux
WHEN defining MessageRequest type
THEN it includes target (string), message (string), execute (optional boolean)
AND target allows values like "window1", "agent-11", "all"

## MODIFIED Requirements

### Requirement: Update Request Structure Types
Request types SHALL use 'agents' object structure instead of flat structure.

#### Scenario: RunsRequest structure
GIVEN the OpenAPI requires nested agents object
WHEN defining RunsRequest type
THEN it contains agents object with metaManager and units
AND units is an array of Unit objects with unitId
AND NOT use units_data naming

### Requirement: Fix Response Types
Response types SHALL match actual API responses not file arrays.

#### Scenario: Session response handling
GIVEN the API returns session information
WHEN defining ApiResponse type
THEN it does NOT include files array
AND includes sessionId, tmuxSession, workingDir fields
AND properly types timestamp as ISO 8601 string

## REMOVED Requirements

### Requirement: Remove Legacy Type Definitions
Old incompatible type definitions SHALL be removed.

#### Scenario: Remove ApiRequest type
GIVEN the ApiRequest type uses wrong structure
WHEN updating type system
THEN ApiRequest with units_data is removed
AND replaced with RunsRequest type

#### Scenario: Remove file-based response
GIVEN ApiResponse expects files array
WHEN aligning with actual API
THEN files array property is removed
AND replaced with session information fields