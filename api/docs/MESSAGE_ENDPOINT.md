# Message Endpoint Documentation

## POST /message

Send a message to agents in a tmux session.

### Request Body

```json
{
  "target": "string",     // Required: Target identifier
  "message": "string",    // Required: Message content to send
  "execute": boolean,     // Optional: Execute as command (default: false)
  "session": "string",    // Required: Tmux session name
  "format": "string"      // Optional: "text" or "base64" (auto-detected if omitted)
}
```

### Field Descriptions

#### target (required)
The target for the message. Can be:
- Agent ID: `"00"` to `"33"`
- Agent name: `"agent-00"` to `"agent-33"`
- Unit: `"meta"`, `"design"`, `"development"`, `"business"`
- Group: `"all"`, `"managers"`, `"workers"`
- Window: `"window0"` to `"window3"`

#### message (required)
The message content to send. Can contain:
- Plain text
- Multi-line content (with newlines)
- Special characters (quotes, backslashes, dollar signs)
- Unicode characters
- Maximum size: 10KB

#### execute (optional)
- `true`: Send Enter key after the message (execute as command) - **Default**
- `false`: Only send the message text (no Enter key)

**Note:** For Claude Code compatibility, "EOF" is automatically sent with Enter key 3 seconds after every message, regardless of the execute flag value. This ensures proper handling of multi-line input and heredoc-style commands.

#### session (required)
The tmux session name, typically in format `"mas-{uuid}"`

#### format (optional)
Message encoding format:
- `"text"`: Plain text format
- `"base64"`: Base64 encoded format
- If omitted, automatically detected based on message content

### Automatic Format Detection

The system automatically uses base64 encoding when the message contains:
- Newlines (`\n`)
- Double quotes (`"`)
- Single quotes (`'`)
- Backslashes (`\`)
- Dollar signs (`$`)

### Response

#### Success (200 OK)
```json
{
  "status": "acknowledged",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "target": "agent-11",
  "session": "mas-abc123",
  "message": "Original message content"
}
```

#### Session Not Found (404)
```json
{
  "status": "failed",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "target": "agent-11",
  "error": "Session not found: mas-abc123"
}
```

#### Validation Error (400)
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["message"],
      "message": "Required"
    }
  ]
}
```

#### Server Error (500)
```json
{
  "status": "failed",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "target": "agent-11",
  "error": "Failed to send message"
}
```

### Examples

#### Simple Message
```bash
curl -X POST http://localhost:8765/message \
  -H "Content-Type: application/json" \
  -d '{
    "target": "agent-11",
    "message": "Hello World",
    "execute": true,
    "session": "mas-abc123"
  }'
```

#### Multi-line Message
```bash
curl -X POST http://localhost:8765/message \
  -H "Content-Type: application/json" \
  -d '{
    "target": "all",
    "message": "Line 1\nLine 2\nLine 3",
    "execute": false,
    "session": "mas-abc123"
  }'
```

#### Code Snippet with Special Characters
```bash
curl -X POST http://localhost:8765/message \
  -H "Content-Type: application/json" \
  -d '{
    "target": "agent-10",
    "message": "echo \"Hello $USER\"\nif [ $? -eq 0 ]; then\n  echo '\''Success'\''\nfi",
    "execute": true,
    "session": "mas-abc123"
  }'
```

#### Explicit Base64 Format
```bash
# Encode message
MESSAGE=$(echo -n "Complex \"message\" with \$variables" | base64)

curl -X POST http://localhost:8765/message \
  -H "Content-Type: application/json" \
  -d "{
    \"target\": \"agent-11\",
    \"message\": \"$MESSAGE\",
    \"execute\": true,
    \"session\": \"mas-abc123\",
    \"format\": \"base64\"
  }"
```

### Implementation Notes

1. **Message Processing Flow:**
   - Client sends raw message text
   - API server determines if base64 encoding is needed
   - If needed, message is base64 encoded
   - Message is passed to `mas send` command with appropriate flags
   - Shell script decodes base64 if needed
   - Tmux receives properly formatted text

2. **Security:**
   - Messages are not evaluated as code
   - Shell metacharacters are safely handled
   - Base64 encoding prevents injection attacks

3. **Performance:**
   - Base64 encoding adds minimal overhead
   - Automatic detection avoids unnecessary encoding
   - 10KB size limit prevents resource exhaustion

4. **Backward Compatibility:**
   - Old clients continue to work without changes
   - New format is automatically applied when beneficial
   - Explicit format specification overrides auto-detection