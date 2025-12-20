# Documentation API Specification

## ADDED Requirements

### Requirement: Documentation Structure Endpoint
The API SHALL provide an endpoint that returns the hierarchical structure of all units and their agents.

#### Scenario: Retrieve unit/agent hierarchy
GIVEN the API server is running
WHEN a GET request is made to `/api/docs/structure`
THEN the response SHALL contain a JSON object with unit groups and their agents
AND each unit SHALL have a name and list of agents with IDs and names

### Requirement: Agent Document Listing
The API SHALL provide an endpoint to list all OpenSpec documents for a specific agent.

#### Scenario: List documents for an agent
GIVEN an agent with ID "22" has OpenSpec documents
WHEN a GET request is made to `/api/docs/agent/22`
THEN the response SHALL contain the agent ID, path, and hierarchical file structure
AND the file structure SHALL include directories and markdown files
AND non-markdown files SHALL be filtered out

#### Scenario: Handle missing agent directory
GIVEN an agent with ID "99" does not exist
WHEN a GET request is made to `/api/docs/agent/99`
THEN the response SHALL return a 404 status
AND include an error message indicating documents not found

### Requirement: Document Content Retrieval
The API SHALL provide an endpoint to retrieve the content of a specific document.

#### Scenario: Retrieve document content
GIVEN an agent "22" has a document at "specs/api.md"
WHEN a GET request is made to `/api/docs/agent/22/file/specs/api.md`
THEN the response SHALL contain the document content as a string
AND include the agent ID and file path in the response

#### Scenario: Handle non-existent document
GIVEN a request for a non-existent document
WHEN a GET request is made to `/api/docs/agent/22/file/missing.md`
THEN the response SHALL return a 404 status
AND include an error message indicating file not found

### Requirement: Directory Traversal Security
The API SHALL prevent directory traversal attacks when serving documents.

#### Scenario: Reject directory traversal attempts
GIVEN a malicious path attempt
WHEN a GET request is made to `/api/docs/agent/22/file/../../sensitive.md`
THEN the request SHALL be rejected
AND return a 400 or 404 status without exposing system files