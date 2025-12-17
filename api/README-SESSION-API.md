# Session Management API Documentation

## Overview
The MAS Session Management API provides endpoints to manage tmux sessions for the Multi-Agent System. This API has been implemented to support the UI team's session selection functionality.

## Base URL
```
http://localhost:8765
```

## Endpoints

### 1. List Sessions
**GET** `/sessions`

Lists all MAS sessions with optional filtering and pagination.

#### Query Parameters:
- `status` (optional): Filter by status ('active', 'inactive', 'all'). Default: 'all'
- `limit` (optional): Number of sessions to return (1-100). Default: 50
- `offset` (optional): Number of sessions to skip for pagination. Default: 0

#### Response (200 OK):
```json
{
  "sessions": [
    {
      "sessionId": "abc12345",
      "tmuxSession": "mas-abc12345",
      "status": "active",
      "workingDir": "/home/user/project",
      "startedAt": "2025-12-17T10:00:00.000Z",
      "agentCount": 4,
      "httpServerStatus": "running"
    }
  ],
  "total": 1,
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

### 2. Get Session Details
**GET** `/sessions/:sessionId`

Retrieves detailed information about a specific session.

#### Parameters:
- `sessionId`: The session identifier

#### Response (200 OK):
```json
{
  "sessionId": "abc12345",
  "tmuxSession": "mas-abc12345",
  "status": "active",
  "workingDir": "/home/user/project",
  "startedAt": "2025-12-17T10:00:00.000Z",
  "agentCount": 4,
  "httpServerStatus": "running",
  "lastActivity": "2025-12-17T10:05:00.000Z",
  "agents": [
    {
      "agentId": "00",
      "name": "Meta Manager",
      "status": "running",
      "window": "meta",
      "pane": 0
    }
  ],
  "windows": [
    {
      "name": "meta",
      "index": 0,
      "paneCount": 1,
      "active": true
    }
  ]
}
```

#### Error Response (404 Not Found):
```json
{
  "error": "Session not found",
  "details": { "sessionId": "abc12345" },
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

### 3. Connect to Session
**POST** `/sessions/:sessionId/connect`

Generates connection information for connecting to an existing session.

#### Parameters:
- `sessionId`: The session identifier

#### Request Body:
```json
{
  "reconnect": false,  // Optional: Force reconnection
  "window": "meta"     // Optional: Target window ('meta', 'design', 'development', 'business')
}
```

#### Response (200 OK):
```json
{
  "sessionId": "abc12345",
  "tmuxSession": "mas-abc12345",
  "attachCommand": "tmux attach-session -t mas-abc12345",
  "status": "connected",
  "timestamp": "2025-12-17T10:00:00.000Z",
  "connectionDetails": {
    "windows": 4,
    "activeAgents": 4,
    "focusedWindow": "meta"
  }
}
```

### 4. Stop Session
**POST** `/sessions/:sessionId/stop`

Stops a MAS session.

#### Parameters:
- `sessionId`: The session identifier

#### Request Body:
```json
{
  "force": false  // Optional: Force stop without confirmation
}
```

#### Response (200 OK):
```json
{
  "sessionId": "abc12345",
  "status": "stopped",
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

### 5. Get Session Agents
**GET** `/sessions/:sessionId/agents`

Retrieves the status of all agents in a session.

#### Parameters:
- `sessionId`: The session identifier

#### Response (200 OK):
```json
{
  "sessionId": "abc12345",
  "agents": [
    {
      "agentId": "00",
      "name": "Meta Manager",
      "status": "running",
      "window": "meta",
      "pane": 0
    },
    {
      "agentId": "10",
      "name": "Design Manager",
      "status": "stopped",
      "window": "design",
      "pane": 0
    }
  ],
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

## Status Values

### Session Status
- `active`: Session is running and has an attached client
- `inactive`: Session is running but no client is attached
- `terminated`: Session has been terminated

### Agent Status
- `running`: Agent is actively running
- `stopped`: Agent is not running
- `error`: Agent encountered an error

### HTTP Server Status
- `running`: HTTP server is active
- `stopped`: HTTP server is not active

## Testing

To run the API tests:
```bash
cd api
npm run test:run
```

To run tests with UI:
```bash
npm run test:ui
```

## Integration with UI

The API is now ready for integration with the UI components. The endpoints match the expected interfaces defined by the UI team:

1. `SessionInfo` type matches the response from `/sessions`
2. `SessionDetail` type matches the response from `/sessions/:sessionId`
3. `ConnectionInfo` type matches the response from `/sessions/:sessionId/connect`

## Example Usage

### List all active sessions:
```bash
curl http://localhost:8765/sessions?status=active
```

### Get details for a specific session:
```bash
curl http://localhost:8765/sessions/abc12345
```

### Connect to a session:
```bash
curl -X POST http://localhost:8765/sessions/abc12345/connect \
  -H "Content-Type: application/json" \
  -d '{"window": "development"}'
```

### Stop a session:
```bash
curl -X POST http://localhost:8765/sessions/abc12345/stop \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

## Notes

- Session IDs are typically the first 8 characters of a UUID
- Tmux session names follow the pattern `mas-{sessionId}`
- The API server must be running on port 8765 (default) or the port specified in `MAS_API_PORT` environment variable
- CORS is enabled for all origins to support frontend development