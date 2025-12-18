# Isolated Sessions Documentation

## Overview

MAS now supports **isolated session workspaces**, allowing multiple independent sessions to run concurrently without interference. Each session gets its own dedicated workspace directory with isolated units, workflows, and logs.

## Session Modes

MAS supports two session modes:

### 1. Legacy Mode (Default)
- Single session at a time
- Shared `unit/` and `workflows/` directories
- Session name: `mas-tmux` or project-based
- Backward compatible with existing setups

### 2. Isolated Mode (New)
- Multiple concurrent sessions
- Each session has its own workspace: `sessions/{uuid}/`
- Session name: `mas-{uuid-prefix}`
- Complete isolation between sessions

## Usage

### Command Line

```bash
# Start an isolated session
MAS_SESSION_MODE=isolated ./mas_refactored.sh start

# Start with specific session ID
MAS_SESSION_MODE=isolated MAS_SESSION_ID=my-session-id ./mas_refactored.sh start

# Legacy mode (default)
./mas_refactored.sh start
```

### API

```bash
# Create isolated session via API
curl -X POST http://localhost:8765/runs \
  -H "Content-Type: application/json" \
  -d '{
    "sessionMode": "isolated",
    "agents": {
      "units": [{
        "unitId": 1,
        "manager": {
          "id": "10",
          "prompt": "Design Manager"
        },
        "workers": [{
          "id": "11",
          "prompt": "Design Worker"
        }]
      }]
    }
  }'

# Response includes workspace paths
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "tmuxSession": "mas-550e8400",
  "workingDir": "/path/to/mas/sessions/550e8400-e29b-41d4-a716-446655440000",
  "sessionMode": "isolated",
  "unitDir": "/path/to/mas/sessions/550e8400-e29b-41d4-a716-446655440000/unit",
  "workflowsDir": "/path/to/mas/sessions/550e8400-e29b-41d4-a716-446655440000/workflows",
  "status": "started"
}
```

## Directory Structure

### Isolated Session Workspace
```
mas/
├── sessions/
│   ├── {session-uuid}/
│   │   ├── .session              # Session metadata
│   │   ├── config.json           # Session configuration
│   │   ├── unit/                 # Session-specific units
│   │   │   ├── 00/              # Meta Manager
│   │   │   ├── 10-13/           # Design Unit
│   │   │   ├── 20-23/           # Development Unit
│   │   │   └── 30-33/           # Business Unit
│   │   ├── workflows/            # Session-specific workflows
│   │   └── logs/                 # Session logs
│   └── .sessions.index           # Active sessions registry
├── unit/                         # Template units (read-only)
└── workflows/                    # Template workflows (read-only)
```

## Session Management

### List Sessions

```bash
# Via API
curl http://localhost:8765/sessions

# Via command line
tmux ls | grep "^mas-"
```

### Get Session Details

```bash
# Via API
curl http://localhost:8765/sessions/{sessionId}

# Via metadata file
cat sessions/{sessionId}/.session
```

### Stop Session

```bash
# Via API
curl -X POST http://localhost:8765/sessions/{sessionId}/stop

# Via command line
./mas_refactored.sh stop
```

## Environment Variables

- `MAS_SESSION_MODE`: Set to `"isolated"` or `"legacy"` (default: `"legacy"`)
- `MAS_SESSION_ID`: Specify custom session ID (isolated mode only)
- `MAS_SESSION_NAME`: Override session name (API usage)

## Session Metadata

Each isolated session has a `.session` file containing:

```bash
SESSION_ID=550e8400-e29b-41d4-a716-446655440000
TMUX_SESSION=mas-550e8400
STATUS=active
CREATED_AT=2025-12-18T08:00:00Z
UNIT_DIR=/path/to/sessions/{uuid}/unit
WORKFLOWS_DIR=/path/to/sessions/{uuid}/workflows
SESSION_DIR=/path/to/sessions/{uuid}
```

## Benefits

1. **Complete Isolation**: Each session has independent workspace
2. **Parallel Execution**: Run multiple sessions simultaneously
3. **Easy Cleanup**: Remove entire session directory when done
4. **Resource Tracking**: Clear visibility of per-session resources
5. **Backward Compatible**: Legacy mode still available

## Testing

Run the test scripts to verify isolated session functionality:

```bash
# Test basic isolated session functions
./test_isolated_session.sh

# Test API integration (requires API server running)
./test_api_isolated.sh
```

## Migration from Legacy

To migrate existing workflows to isolated mode:

1. Set `MAS_SESSION_MODE=isolated` in your environment
2. Sessions will automatically use the new structure
3. Templates in `unit/` and `workflows/` remain unchanged
4. Each new session copies templates to its workspace

## Limitations

- Auto-cleanup is not implemented (manual cleanup required)
- HTTP server port sharing between sessions needs configuration
- Session archives are not implemented

## Troubleshooting

### Session directory not created
- Check write permissions on `sessions/` directory
- Verify templates exist in `unit/` and `workflows/`

### UUID generation fails
- Ensure `/proc/sys/kernel/random/uuid` exists or `/dev/urandom` is accessible

### Sessions index errors
- Reset index file: `echo '{"version":"1.0","sessions":[],"lastUpdated":""}' > sessions/.sessions.index`
- Ensure `jq` is installed for index management

### Tmux session conflicts
- Check for existing sessions: `tmux ls`
- Kill conflicting sessions: `tmux kill-session -t mas-{id}`