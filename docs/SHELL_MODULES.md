# MAS Shell Script Modules Documentation

## Overview

The MAS system uses modular bash scripts to organize functionality. Each module handles a specific aspect of the system and can be sourced by other scripts.

## Module Loading

Modules are loaded using the `source` command:

```bash
source "$SCRIPT_DIR/lib/agent.sh"
source "$SCRIPT_DIR/lib/message.sh"
source "$SCRIPT_DIR/lib/session.sh"
source "$SCRIPT_DIR/lib/tmux.sh"
```

## Core Modules

### lib/agent.sh

**Purpose:** Manages agent lifecycle and configuration

**Key Functions:**

#### `init_agent_directory(unit_dir, unit_num, workflows_dir)`
Initializes a single agent's workspace directory.

```bash
init_agent_directory "./unit" "11" "./workflows"
```

#### `start_agent(session_name, window, pane, unit_num, unit_dir)`
Starts a single agent in specified tmux pane.

```bash
start_agent "mas-123" "design" "1" "11" "./unit"
```

#### `start_all_agents(session_name, unit_dir)`
Starts all 13 agents in their respective positions.

```bash
start_all_agents "mas-123" "./unit"
```

#### `stop_agent(session_name, window, pane)`
Stops a single agent by sending Ctrl+C.

```bash
stop_agent "mas-123" "design" "1"
```

#### `stop_all_agents(session_name)`
Stops all running agents.

```bash
stop_all_agents "mas-123"
```

**Configuration Arrays:**
- `AGENT_MODELS` - Maps agent IDs to AI models (opus/sonnet)
- `AGENT_NAMES` - Human-readable agent names
- `UNIT_NAMES` - Maps unit names to agent IDs

### lib/message.sh

**Purpose:** Routes messages between agents

**Key Functions:**

#### `route_message(target, message, execute, sender)`
Main routing function that expands targets and delivers messages.

```bash
route_message "11" "Hello" "true" "00"
route_message "design" "Team message" "false"
route_message "all" "Broadcast" "true"
```

#### `expand_target(target)`
Expands target specification to list of agent IDs.

```bash
expand_target "design"     # Returns: "10 11 12 13"
expand_target "managers"   # Returns: "00 10 20 30"
expand_target "11"         # Returns: "11"
```

#### `send_to_agent(session_name, agent_id, message, execute)`
Sends message to specific agent.

```bash
send_to_agent "mas-123" "11" "Task assignment" "true"
```

#### `get_agent_window_pane(agent_id)`
Maps agent ID to tmux window.pane coordinates.

```bash
get_agent_window_pane "11"  # Returns: "design.1"
```

**Target Types:**
- Individual agents: `00` to `33`
- Units: `meta`, `design`, `development`, `business`
- Groups: `managers`, `workers`, `all`
- Multiple: `"10,11,12"` (comma-separated)

### lib/session.sh

**Purpose:** Manages MAS sessions and persistence

**Key Functions:**

#### `generate_session_id(prefix)`
Generates unique session identifier.

```bash
SESSION_ID=$(generate_session_id "mas")  # mas-20251218-a1b2c3d4
```

#### `find_active_session()`
Finds currently active MAS session.

```bash
SESSION_NAME=$(find_active_session)
```

Priority order:
1. `$MAS_SESSION_NAME` environment variable
2. Attached tmux session matching `mas-*`
3. First found `mas-*` session

#### `generate_uuid()`
Generates UUID v4 for session identification.

```bash
UUID=$(generate_uuid)  # f47ac10b-58cc-4372-a567-0e02b2c3d479
```

#### `create_session_workspace(session_id, config_file)`
Creates isolated workspace for session.

```bash
WORKSPACE=$(create_session_workspace "$SESSION_ID" "config.json")
```

#### `start_http_server(session_name, port, host, project_dir)`
Starts the API server for the session.

```bash
start_http_server "mas-123" 8765 "0.0.0.0" "."
```

#### `stop_http_server(project_dir)`
Stops the API server.

```bash
stop_http_server "."
```

**Session Management:**
- Session metadata stored in `.session` file
- HTTP server PID tracked in `.mas_http.pid`
- Supports isolated session workspaces

### lib/tmux.sh

**Purpose:** Low-level tmux operations

**Key Functions:**

#### `session_exists(session_name)`
Checks if tmux session exists.

```bash
if session_exists "mas-123"; then
    echo "Session exists"
fi
```

#### `create_session(session_name)`
Creates new tmux session.

```bash
create_session "mas-123"
```

#### `create_window(session_name, window_name, window_index)`
Creates tmux window.

```bash
create_window "mas-123" "design" 1
```

#### `split_window_grid(session_name, window_name)`
Splits window into 2x2 grid (4 panes).

```bash
split_window_grid "mas-123" "design"
```

#### `send_to_pane(session_name, window, pane, command)`
Sends command to specific pane (with Enter).

```bash
send_to_pane "mas-123" "design" "1" "echo 'Hello'"
```

#### `send_keys_to_pane(session_name, window, pane, keys)`
Sends keys to pane (without Enter).

```bash
send_keys_to_pane "mas-123" "design" "1" "partial command"
```

#### `attach_to_session(session_name, window)`
Attaches to tmux session.

```bash
attach_to_session "mas-123" "design"
```

#### `kill_session(session_name)`
Terminates tmux session.

```bash
kill_session "mas-123"
```

**Window Layout:**
- Window 0: meta (1 pane)
- Window 1: design (4 panes in 2x2 grid)
- Window 2: development (4 panes in 2x2 grid)
- Window 3: business (4 panes in 2x2 grid)

### lib/agent_init.sh

**Purpose:** Initializes agent environment with mas command access

**Environment Setup:**
```bash
# Sets up:
- mas command alias
- PATH with MAS directory
- MAS_PROJECT_ROOT environment variable
```

**Usage:**
Sourced automatically when agents start to ensure mas command availability.

## Module Dependencies

```
mas_refactored.sh
├── lib/tmux.sh (base layer)
├── lib/session.sh
│   └── lib/tmux.sh
├── lib/agent.sh
│   └── lib/tmux.sh
└── lib/message.sh
    ├── lib/tmux.sh
    └── lib/agent.sh
```

## Common Patterns

### Error Handling

```bash
if ! session_exists "$SESSION_NAME"; then
    print_error "Session not found"
    return 1
fi
```

### Function Return Values

- `0` - Success
- `1` - General error
- Other - Specific error codes

### Environment Variables

Modules respect these environment variables:

- `MAS_SESSION_NAME` - Override session detection
- `SESSION_NAME` - Current session name
- `SCRIPT_DIR` - MAS installation directory
- `DEBUG_MODULES` - Enable debug output

### Printing Functions

Standard output functions (defined in mas_refactored.sh):

```bash
print_info "Information message"
print_success "Success message"
print_warning "Warning message"
print_error "Error message"
```

## Extension Points

### Adding New Modules

1. Create file in `lib/` directory
2. Follow naming convention: `mas-<function>.sh`
3. Include module header:

```bash
#!/usr/bin/env bash

# lib/mas-custom.sh - Custom functionality
# Description of module purpose

# Load dependencies
LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$LIB_DIR/mas-tmux.sh"
```

### Adding Agent Types

Modify in `lib/agent.sh`:

```bash
AGENT_MODELS["40"]="opus"
AGENT_NAMES["40"]="New Agent Type"
```

### Custom Message Targets

Extend `expand_target()` in `lib/message.sh`:

```bash
custom-group)
    echo "10 20 30"  # Return agent IDs
    ;;
```

## Best Practices

1. **Always check session existence** before operations
2. **Use provided utility functions** instead of direct tmux commands
3. **Handle errors gracefully** with meaningful messages
4. **Export only necessary variables** to avoid pollution
5. **Document functions** with usage examples
6. **Test in isolation** - modules should work independently
7. **Follow naming conventions** for consistency

## Debugging

Enable debug output:

```bash
DEBUG_MODULES=1 mas start
```

Trace execution:

```bash
set -x  # Enable trace
source lib/agent.sh
set +x  # Disable trace
```

Test individual functions:

```bash
source lib/message.sh
expand_target "design"
```

## Module API Reference

For detailed function signatures and parameters, refer to the source code comments in each module file. Each function includes:

- Purpose description
- Parameter documentation
- Return value specification
- Usage examples