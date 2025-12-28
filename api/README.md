# MAS API Server

Multi-Agent System (MAS) HTTP API server built with Hono framework.

## Overview

The MAS API server provides a RESTful interface for managing multi-agent tmux sessions. It acts as a proxy layer between external interfaces (WebUI, external tools) and the MAS shell command system.

## Architecture

The API follows a layered architecture:

```
External Interface → API Server → mas command → tmux sessions
```

The API server **validates requests** and **forwards commands** but does not implement routing logic directly. All message routing is handled by the `mas send` command.

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- tmux installed
- MAS system installed

### Installation

```bash
cd api/
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Type checking
npm run type-check
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAS_API_PORT` | API server port | `8765` |
| `MAS_API_HOST` | API server host | `0.0.0.0` |
| `MAS_LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |

## API Endpoints

### Health Check

Check if the API server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T09:00:00.000Z"
}
```

### List Sessions

Get all active MAS tmux sessions.

**Endpoint:** `GET /sessions`

**Response:**
```json
{
  "sessions": [
    {
      "name": "mas-a85df580",
      "windows": 4,
      "created": "Thu Dec 18 18:08:23 2025",
      "attached": true
    }
  ]
}
```

### Send Message

Send a message to an agent or group of agents.

**Endpoint:** `POST /message`

**Request Body:**
```json
{
  "target": "11",           // Required: Agent ID (00-33), unit name, or "all"
  "message": "Hello",       // Required: Message to send
  "session": "mas-a85df580", // Required: Target tmux session
  "execute": true          // Optional: Send Enter key after message (default: true)
}

**Note:** For Claude Code compatibility, "EOF" is automatically sent 3 seconds after every message, regardless of the execute flag. This ensures proper handling of multi-line input and heredoc-style commands.
```

**Response (Success):**
```json
{
  "status": "acknowledged",
  "timestamp": "2025-12-18T09:00:00.000Z",
  "target": "11",
  "session": "mas-a85df580",
  "message": "Hello"
}
```

**Response (Error - Session Not Found):**
```json
{
  "status": "failed",
  "timestamp": "2025-12-18T09:00:00.000Z",
  "target": "11",
  "error": "Session not found: mas-invalid"
}
```
Status Code: 404

**Response (Error - Validation):**
```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["session"],
      "message": "Session is required"
    }
  ]
}
```
Status Code: 400

### Target Options

The `target` parameter accepts:

- **Agent IDs:** `00` to `33` (individual agents)
- **Unit names:**
  - `meta` - Meta manager (00)
  - `design` - Design unit (10-13)
  - `development` - Development unit (20-23)
  - `business` - Business unit (30-33)
- **Groups:**
  - `managers` - All managers (00, 10, 20, 30)
  - `workers` - All workers (11-13, 21-23, 31-33)
  - `all` - All agents

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Not Found (session doesn't exist) |
| 500 | Internal Server Error |

## Integration Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:8765/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    target: '11',
    message: 'Start UI design task',
    session: 'mas-a85df580',
    execute: true
  })
});

const result = await response.json();
console.log(result);
```

### cURL

```bash
curl -X POST http://localhost:8765/message \
  -H "Content-Type: application/json" \
  -d '{
    "target": "design",
    "message": "Review the new mockups",
    "session": "mas-a85df580",
    "execute": true
  }'
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:8765/message',
    json={
        'target': 'all',
        'message': 'Team meeting in 5 minutes',
        'session': 'mas-a85df580',
        'execute': True
    }
)

print(response.json())
```

## Development

### Project Structure

```
api/
├── server.ts           # Main server entry point
├── routes/
│   ├── health.ts      # Health check endpoint
│   ├── message.ts     # Message handling
│   └── sessions.ts    # Session management
├── validators/
│   └── message.ts     # Request validation schemas
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── tests/             # Test suites
```

### Adding New Endpoints

1. Create route file in `routes/`
2. Add validator in `validators/` if needed
3. Register route in `server.ts`
4. Add tests in `tests/`
5. Update this documentation

## Testing

The API includes comprehensive tests:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Security Considerations

- The API server binds to `0.0.0.0` by default for container compatibility
- No authentication is currently implemented (suitable for local development)
- For production deployment, consider:
  - Adding authentication (API keys, JWT, etc.)
  - Implementing rate limiting
  - Using HTTPS/TLS
  - Restricting CORS origins
  - Input sanitization for shell command injection prevention

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8765
lsof -i :8765

# Kill the process
kill -9 <PID>
```

### Session Not Found

Ensure the tmux session exists:
```bash
tmux ls
```

### API Server Won't Start

Check logs:
```bash
cat .mas_api.log
```

## License

See the main project LICENSE file.